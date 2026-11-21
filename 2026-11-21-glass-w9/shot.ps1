param([int]$ProcId, [string]$Out, [switch]$Unfocus, [switch]$NoMove, [switch]$Backdrop)
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System; using System.Runtime.InteropServices;
public static class W {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr h, IntPtr a, int x, int y, int cx, int cy, uint f);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
  public struct RECT { public int L, T, R, B; }
}
"@
[W]::SetProcessDPIAware() | Out-Null
$h = (Get-Process -Id $ProcId).MainWindowHandle
if ($h -eq 0) { throw "no window" }
if (-not $NoMove) { [W]::ShowWindow($h, 9) | Out-Null }
if (-not $NoMove) { [W]::SetWindowPos($h, [IntPtr]::Zero, 40, 40, 1280, 800, 0x0040) | Out-Null }
$bd = $null
if ($Backdrop) {
  $bd = New-Object System.Windows.Forms.Form
  $bd.FormBorderStyle = "None"; $bd.StartPosition = "Manual"; $bd.ShowInTaskbar = $false
  $bd.Location = New-Object System.Drawing.Point(0, 0); $bd.Size = New-Object System.Drawing.Size(1400, 900)
  $bmp0 = New-Object System.Drawing.Bitmap 1400, 900
  $g0 = [System.Drawing.Graphics]::FromImage($bmp0)
  $lg = New-Object System.Drawing.Drawing2D.LinearGradientBrush((New-Object System.Drawing.Point(0,0)), (New-Object System.Drawing.Point(1400,900)), [System.Drawing.Color]::FromArgb(255,255,120,60), [System.Drawing.Color]::FromArgb(255,40,90,220))
  $g0.FillRectangle($lg, 0, 0, 1400, 900)
  $g0.FillEllipse([System.Drawing.Brushes]::Gold, 60, 380, 260, 260)
  $g0.FillEllipse([System.Drawing.Brushes]::MediumSeaGreen, 700, 80, 300, 300)
  $f0 = New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)
  $g0.DrawString("BEHIND THE WINDOW", $f0, [System.Drawing.Brushes]::White, 40, 160)
  $bd.BackgroundImage = $bmp0
  $bd.Show(); [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 300
}
[W]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [W]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[W]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds 900
$f = $null
if ($Unfocus) {
  $f = New-Object System.Windows.Forms.Form
  $f.StartPosition = "Manual"; $f.Location = New-Object System.Drawing.Point(1500, 880); $f.Size = New-Object System.Drawing.Size(300, 150)
  $f.Text = "focus"; $f.Show(); $f.Activate(); [System.Windows.Forms.Application]::DoEvents()
  Start-Sleep -Milliseconds 900; [System.Windows.Forms.Application]::DoEvents()
}
$r = New-Object W+RECT; [W]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $hh = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $hh
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
if ($f) { $f.Close() }
if ($bd) { $bd.Close() }
"saved $Out $w x $hh"
