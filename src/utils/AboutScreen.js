const C = {
	fg: "#a9b1d6",
	dim: "#565f89",
	green: "#9ece6a",
	white: "#c0caf5",
};

const rule = "=".repeat(41);
const t = (s, color = C.fg) => [[s, color]];
const section = (title) => [t(rule, C.dim), t(title, C.white), t(rule, C.dim)];
const blank = () => [];

export function aboutLines() {
	return [
		[["$ ", C.green], ["omarchy-debug --print --no-sudo", C.fg]],
		t("Date: Sun Sep 13 14:02:11 AEST 2026"),
		t("Hostname: framework"),
		t("Omarchy Branch: master"),
		blank(),
		...section("SYSTEM INFORMATION"),
		t("System:"),
		t("  Kernel: 6.16.8-arch1-1 arch: x86_64 bits: 64 compiler: gcc v: 15.2.1"),
		t("  Desktop: Hyprland v: 0.51.1 Distro: Omarchy 3.8.5 base: Arch Linux"),
		t("Machine:"),
		t("  Type: Laptop System: Framework product: Laptop 13 (AMD Ryzen 7040Series)"),
		t("CPU:"),
		t("  Info: 8-core model: AMD Ryzen 7 7840U w/ Radeon 780M Graphics bits: 64"),
		t("    type: MT MCP arch: Zen 4 cache: L2: 8 MiB"),
		t("  Speed (MHz): avg: 1189 min/max: 400/5132"),
		t("Graphics:"),
		t("  Device-1: AMD Phoenix1 driver: amdgpu v: kernel"),
		t("  Display: wayland server: Hyprland v: 0.51.1 compositor: Hyprland"),
		t("  API: Vulkan v: 1.4.321 drivers: radv surfaces: xcb,xlib,wayland"),
		t("Memory:"),
		t("  System RAM: total: 32 GiB available: 30.62 GiB used: 6.42 GiB (21.0%)"),
		blank(),
		...section("DMESG"),
		t("(skipped - --no-sudo flag used)"),
		blank(),
		...section("JOURNALCTL (CURRENT BOOT, WARNINGS+ERRORS)"),
		t("Sep 13 13:48:02 framework kernel: amdgpu 0000:c1:00.0: amdgpu: SMU is initialized"),
		blank(),
		...section("INSTALLED PACKAGES"),
		t("alacritty 0.15.1-1 (extra)"),
		t("hyprland 0.51.1-1 (extra)"),
		t("omarchy-chromium 141.0.7390.54-1 (omarchy)"),
		t("walker-bin 0.13.25-1 (AUR)"),
	];
}
