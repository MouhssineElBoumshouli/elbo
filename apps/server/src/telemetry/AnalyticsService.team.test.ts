import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, it } from "@effect/vitest";
import * as ConfigProvider from "effect/ConfigProvider";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as TestClock from "effect/testing/TestClock";
import * as HttpClient from "effect/http/HttpClient";
import * as HttpClientResponse from "effect/http/HttpClientResponse";
import * as HostProcess from "@t3tools/shared/HostProcess";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

import * as ServerConfig from "../config.ts";
import * as ManagedPolicy from "../policy/ManagedPolicy.ts";
import * as AnalyticsService from "./AnalyticsService.ts";

// team-layer: Elbo's build must never send usage data, whatever the environment says.
const countSends = (analyticsLayer: typeof AnalyticsService.layer, env: Record<string, unknown>) =>
  Effect.gen(function* () {
    const sent: Array<string> = [];
    const client = HttpClient.make((request) => {
      sent.push(request.url);
      return Effect.succeed(
        HttpClientResponse.fromWeb(request, new Response(null, { status: 200 })),
      );
    });
    const runtimeLayer = analyticsLayer.pipe(
      Layer.provideMerge(
        ServerConfig.ServerConfig.layerTest(process.cwd(), { prefix: "elbo-telemetry-off-" }),
      ),
      Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))),
      Layer.provide(
        Layer.mergeAll(
          Layer.succeed(HostProcess.Platform, "win32"),
          Layer.succeed(HostProcess.Architecture, "x64"),
          Layer.succeed(HttpClient.HttpClient, client),
          ManagedPolicy.layerTest(),
        ),
      ),
    );
    yield* Effect.gen(function* () {
      const analytics = yield* AnalyticsService.AnalyticsService;
      yield* analytics.record("server.boot.heartbeat", { threadCount: 1 });
      yield* analytics.recordOwners([{ source: "device", ownerId: "a".repeat(64) }], "client");
      yield* analytics.flush;
      yield* TestClock.adjust("1 minute");
    }).pipe(Effect.provide(runtimeLayer));
    return sent;
  });

it.layer(Layer.mergeAll(NodeServices.layer, NodeCrypto.layer))("Elbo usage data", (it) => {
  it.effect("is off in the identity file", () =>
    Effect.sync(() => assert.isFalse(TEAM_IDENTITY.usageData)),
  );

  it.effect("sends nothing even when the environment turns telemetry on", () =>
    Effect.gen(function* () {
      const sent = yield* countSends(AnalyticsService.layer, {
        T3CODE_TELEMETRY_ENABLED: true,
        T3CODE_POSTHOG_KEY: "phc_test_key",
        T3CODE_POSTHOG_HOST: "http://localhost",
      });
      assert.deepStrictEqual(sent, []);
    }),
  );

  it.effect("has no built-in key or host, so even the upstream service sends nothing", () =>
    Effect.gen(function* () {
      const sent = yield* countSends(AnalyticsService.layerUpstream, {});
      assert.deepStrictEqual(sent, []);
    }),
  );
});
