param([int]$Root, [int]$Seconds = 10)
$all = Get-CimInstance Win32_Process | select ProcessId, ParentProcessId
function Kids($id) { $all | ? { $_.ParentProcessId -eq $id } | % { $_.ProcessId; Kids $_.ProcessId } }
$elbo = @($Root) + @(Kids $Root)
$dwm = @(Get-Process dwm | % Id)
$samples = Get-Counter '\GPU Engine(*engtype_3D)\Utilization Percentage' -SampleInterval 1 -MaxSamples $Seconds
function Sum($s, $ids) { ($s.CounterSamples | ? { $n = $_.InstanceName; $ids | ? { $n -like "pid_$($_)_*" } } | Measure-Object CookedValue -Sum).Sum }
$e = $samples | % { [double](Sum $_ $elbo) }
$d = $samples | % { [double](Sum $_ $dwm) }
"elbo3d avg {0:N1}% max {1:N1}% | dwm3d avg {2:N1}% max {3:N1}%" -f ($e | Measure -Average).Average, ($e | Measure -Maximum).Maximum, ($d | Measure -Average).Average, ($d | Measure -Maximum).Maximum
