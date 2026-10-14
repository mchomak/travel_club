# Independent browser measurements

1440x900, dev test_6 after three passes, same default quality. Sample active render frame counter for2.5s.

- chromium.launch({headless:true,channel:chromium}): NVIDIA GeForce RTX4060 Direct3D11;300 actual frames/2.5174s=119.1706FPS.
- Same with --use-angle=d3d11:299frames/2.5191s=118.6932FPS.
- Default headless shell: ANGLE Vulkan SwiftShader software; baseline approximately15.6284FPS. This is a software rasterizer result, not hardware laptop evidence.

Measured on this host only. Do not generalize to all laptops. Root inspected saved initial/25/50/75/final and three sequential pass frames; curl geometry and shadow/composition changes are visibly present. Final rendering is on demand.
