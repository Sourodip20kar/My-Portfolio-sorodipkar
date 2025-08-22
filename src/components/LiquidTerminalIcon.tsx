// src/components/LiquidTerminalIcon.tsx
'use client';

import { useEffect, useRef } from 'react';

const liquidFragSource = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D u_image_texture;
uniform float u_time;
uniform float u_ratio;
uniform float u_img_ratio;
uniform float u_patternScale;
uniform float u_refraction;
uniform float u_edge;
uniform float u_patternBlur;
uniform float u_liquid;
#define TWO_PI 6.28318530718
#define PI 3.14159265358979323846
vec3 mod289(vec3 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec2 mod289(vec2 x) { return x - floor(x * (1. / 289.)) * 289.; }
vec3 permute(vec3 x) { return mod289(((x*34.)+1.)*x); }
float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1., 0.) : vec2(0., 1.);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0., i1.y, 1.)) + i.x + vec3(0., i1.x, 1.));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.);
    m = m*m;
    m = m*m;
    vec3 x = 2. * fract(p * C.www) - 1.;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130. * dot(m, g);
}
vec2 get_img_uv() {
    vec2 img_uv = vUv;
    img_uv -= .5;
    if (u_ratio > u_img_ratio) {
        img_uv.x = img_uv.x * u_ratio / u_img_ratio;
    } else {
        img_uv.y = img_uv.y * u_img_ratio / u_ratio;
    }
    img_uv += .5;
    img_uv.y = 1. - img_uv.y;
    return img_uv;
}
vec2 rotate(vec2 uv, float th) { return mat2(cos(th), sin(th), -sin(th), cos(th)) * uv; }
float get_color_channel(float c1, float c2, float stripe_p, vec3 w, float extra_blur, float b) {
    float ch = c2;
    float blur = u_patternBlur + extra_blur;
    ch = mix(ch, c1, smoothstep(.0, blur, stripe_p));
    float border = w[0];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    b = smoothstep(.2, .8, b);
    border = w[0] + .4 * (1. - b) * w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + .5 * (1. - b) * w[1];
    ch = mix(ch, c2, smoothstep(border - blur, border + blur, stripe_p));
    border = w[0] + w[1];
    ch = mix(ch, c1, smoothstep(border - blur, border + blur, stripe_p));
    float gradient_t = (stripe_p - w[0] - w[1]) / w[2];
    float gradient = mix(c1, c2, smoothstep(0., 1., gradient_t));
    ch = mix(ch, gradient, smoothstep(border - blur, border + blur, stripe_p));
    return ch;
}
float get_img_frame_alpha(vec2 uv, float img_frame_width) {
    float a = smoothstep(0., img_frame_width, uv.x) * smoothstep(1., 1. - img_frame_width, uv.x);
    a *= smoothstep(0., img_frame_width, uv.y) * smoothstep(1., 1. - img_frame_width, uv.y);
    return a;
}
void main() {
    vec2 uv = vUv;
    uv.y = 1. - uv.y;
    uv.x *= u_ratio;
    float diagonal = uv.x - uv.y;
    float t = .001 * u_time;
    vec2 img_uv = get_img_uv();
    vec4 img = texture(u_image_texture, img_uv);
    vec3 color = vec3(0.);
    vec3 color1 = vec3(.98, 0.98, 1.);
    vec3 color2 = vec3(.1, .1, .1 + .1 * smoothstep(.7, 1.3, uv.x + uv.y));
    float edge = img.r;
    vec2 grad_uv = uv - .5;
    float dist = length(grad_uv + vec2(0., .2 * diagonal));
    grad_uv = rotate(grad_uv, (.25 - .2 * diagonal) * PI);
    float bulge = 1. - pow(1.8 * dist, 1.2);
    bulge *= pow(uv.y, .3);
    float cycle_width = u_patternScale;
    float thin_strip_1_ratio = .12 / cycle_width * (1. - .4 * bulge);
    float thin_strip_2_ratio = .07 / cycle_width * (1. + .4 * bulge);
    float wide_strip_ratio = 1. - thin_strip_1_ratio - thin_strip_2_ratio;
    float thin_strip_1_width = cycle_width * thin_strip_1_ratio;
    float thin_strip_2_width = cycle_width * thin_strip_2_ratio;
    float opacity = 1. - smoothstep(.9 - .5 * u_edge, 1. - .5 * u_edge, edge);
    opacity *= get_img_frame_alpha(img_uv, 0.01);
    float noise = snoise(uv - t);
    edge += (1. - edge) * u_liquid * noise;
    float refr = clamp(1. - bulge, 0., 1.);
    float dir = grad_uv.x + diagonal;
    dir -= 2. * noise * diagonal * (smoothstep(0., 1., edge) * smoothstep(1., 0., edge));
    bulge *= clamp(pow(uv.y, .1), .3, 1.);
    dir *= .1 + (1.1 - edge) * bulge;
    dir *= smoothstep(1., .7, edge);
    dir += .18 * (smoothstep(.1, .2, uv.y) * smoothstep(.4, .2, uv.y));
    dir += .03 * (smoothstep(.1, .2, 1. - uv.y) * smoothstep(.4, .2, 1. - uv.y));
    dir *= .5 + .5 * pow(uv.y, 2.);
    dir *= cycle_width;
    dir -= t;
    float refr_r = refr + .03 * bulge * noise;
    float refr_b = 1.3 * refr;
    refr_r += 5. * (smoothstep(-.1, .2, uv.y) * smoothstep(.5, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(1., .4, bulge));
    refr_r -= diagonal;
    refr_b += (smoothstep(0., .4, uv.y) * smoothstep(.8, .1, uv.y)) * (smoothstep(.4, .6, bulge) * smoothstep(.8, .4, bulge));
    refr_b -= .2 * edge;
    refr_r *= u_refraction;
    refr_b *= u_refraction;
    vec3 w = vec3(thin_strip_1_width, thin_strip_2_width, wide_strip_ratio);
    w[1] -= .02 * smoothstep(.0, 1., edge + bulge);
    float r = get_color_channel(color1.r, color2.r, mod(dir + refr_r, 1.), w, 0.02 + .03 * u_refraction * bulge, bulge);
    float g = get_color_channel(color1.g, color2.g, mod(dir, 1.), w, 0.01 / (1. - diagonal), bulge);
    float b = get_color_channel(color1.b, color2.b, mod(dir - refr_b, 1.), w, .01, bulge);
    color = vec3(r, g, b) * opacity;
    fragColor = vec4(color, opacity);
}`;

const vertexShaderSource = `#version 300 es
precision mediump float;
in vec2 a_position;
out vec2 vUv;
void main() {
    vUv = .5 * (a_position + 1.);
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const shaderParams = {
  dispersion:0.06,
  patternScale: 3.0,
  refraction: 0.03,
  edge: 0,
  patternBlur: 0.001,
  liquid: 1,
  speed: 0.280,
};

export default function LiquidTerminalIcon({
  className = "",
  src = "/terminal_1.svg",
}: {
  className?: string;
  src?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set canvas size for crisp rendering
    const size = 54;
    canvas.width = size;
    canvas.height = size;
    
    const gl = canvas.getContext('webgl2', { 
      antialias: true, 
      alpha: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false
    });
    
    if (!gl) {
      console.error("LiquidTerminalIcon: WebGL2 not supported.");
      return;
    }

    // Setup WebGL settings for smooth rendering
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.viewport(0, 0, size, size);
    
    const loadSVGAsImage = async (svgPath: string): Promise<ImageBitmap> => {
      try {
        // First try to fetch as text to handle SVG properly
        const response = await fetch(svgPath);
        const svgText = await response.text();
        
        // Create a blob with the SVG content
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml' });
        
        // Convert to image using URL.createObjectURL
        const url = URL.createObjectURL(svgBlob);
        
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(url);
            // Create canvas to convert to ImageBitmap
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 256;
            tempCanvas.height = 256;
            const tempCtx = tempCanvas.getContext('2d')!;
            tempCtx.drawImage(img, 0, 0, 256, 256);
            
            // Convert canvas to ImageBitmap
            createImageBitmap(tempCanvas)
              .then(resolve)
              .catch(reject);
          };
          img.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load SVG'));
          };
          img.src = url;
        });
      } catch (error) {
        console.error('Error loading SVG:', error);
        throw error;
      }
    };

    const initWebGL = async () => {
      try {
        const bitmap = await loadSVGAsImage(src);
        const processedImageData = processImage(bitmap);
        const program = setupProgram(gl);
        if (!program) return;
        
        const uniforms = getUniforms(program, gl);
        setupGeometry(gl, program);
        setupUniformsAndTexture(gl, uniforms, processedImageData, canvas);
        startAnimation(gl, uniforms);
      } catch (error) {
        console.error("Failed to initialize WebGL:", error);
      }
    };

    initWebGL();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [src]);

  const processImage = (img: ImageBitmap): ImageData => {
    const width = 256, height = 256;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    
    // Clear and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // Create shape mask
    const shapeMask = new Array(width * height).fill(false);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 128) { // More lenient alpha threshold
        shapeMask[i / 4] = true;
      }
    }
    
    // Create boundary mask
    const boundaryMask = new Array(width * height).fill(false);
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        if (!shapeMask[idx]) continue;
        
        let isBoundary = false;
        for (let ny = y - 1; ny <= y + 1; ny++) {
          for (let nx = x - 1; nx <= x + 1; nx++) {
            if (!shapeMask[ny * width + nx]) {
              isBoundary = true;
              break;
            }
          }
          if (isBoundary) break;
        }
        if (isBoundary) boundaryMask[idx] = true;
      }
    }

    // Distance field calculation with improved convergence
    let u = new Float32Array(width * height).fill(0);
    let newU = new Float32Array(width * height).fill(0);
    
    // Initialize boundary conditions
    for (let i = 0; i < shapeMask.length; i++) {
      if (boundaryMask[i]) {
        u[i] = 1.0;
      }
    }
    
    // Iterative solving with better parameters
    for (let iter = 0; iter < 200; iter++) {
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          if (!shapeMask[idx] || boundaryMask[idx]) {
            newU[idx] = u[idx];
            continue;
          }
          
          const sum = u[idx + 1] + u[idx - 1] + u[idx + width] + u[idx - width];
          newU[idx] = sum * 0.25;
        }
      }
      [u, newU] = [newU, u];
    }

    // Normalize and create output
    let maxVal = 0;
    for (let i = 0; i < u.length; i++) {
      if (u[i] > maxVal) maxVal = u[i];
    }

    const outImg = ctx.createImageData(width, height);
    for (let i = 0; i < shapeMask.length; i++) {
      const p = i * 4;
      if (!shapeMask[i]) {
        outImg.data.set([255, 255, 255, 255], p);
      } else {
        const normalizedVal = maxVal > 0 ? u[i] / maxVal : 0;
        const gray = 255 * (1 - Math.pow(normalizedVal, 1.5));
        outImg.data.set([gray, gray, gray, 255], p);
      }
    }
    return outImg;
  };

  const setupProgram = (gl: WebGL2RenderingContext) => {
    const vertexShader = createShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = createShader(gl, liquidFragSource, gl.FRAGMENT_SHADER);
    if (!vertexShader || !fragmentShader) return null;
    
    const program = gl.createProgram();
    if (!program) return null;
    
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    
    gl.useProgram(program);
    return program;
  };

  const createShader = (gl: WebGL2RenderingContext, source: string, type: number) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(`Shader compile error:`, gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  };
  
  const getUniforms = (program: WebGLProgram, gl: WebGL2RenderingContext) => {
    const uniforms: Record<string, WebGLUniformLocation> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < uniformCount; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        const location = gl.getUniformLocation(program, info.name);
        if (location) uniforms[info.name] = location;
      }
    }
    return uniforms;
  };
  
  const setupGeometry = (gl: WebGL2RenderingContext, program: WebGLProgram) => {
    const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    
    const loc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  };

  const setupUniformsAndTexture = (
    gl: WebGL2RenderingContext, 
    uniforms: Record<string, WebGLUniformLocation>, 
    imageData: ImageData,
    canvas: HTMLCanvasElement
  ) => {
    // Set shader parameters
    gl.uniform1f(uniforms.u_edge, shaderParams.edge);
    gl.uniform1f(uniforms.u_patternBlur, shaderParams.patternBlur);
    gl.uniform1f(uniforms.u_patternScale, shaderParams.patternScale);
    gl.uniform1f(uniforms.u_refraction, shaderParams.refraction);
    gl.uniform1f(uniforms.u_liquid, shaderParams.liquid);
    
    // Set aspect ratios
    gl.uniform1f(uniforms.u_img_ratio, 1.0); // Square aspect ratio
    gl.uniform1f(uniforms.u_ratio, 1.0); // Square canvas

    // Create and setup texture
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, imageData.width, imageData.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, imageData.data);
    gl.uniform1i(uniforms.u_image_texture, 0);
  };

  const startAnimation = (gl: WebGL2RenderingContext, uniforms: Record<string, WebGLUniformLocation>) => {
    let lastTime = 0;
    let totalTime = 0;
    
    const render = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;
      totalTime += deltaTime * shaderParams.speed;
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(uniforms.u_time, totalTime);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    animationRef.current = requestAnimationFrame(render);
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className} block`}
      style={{
        width: "59px",
        height: "59px",
        imageRendering: "auto",
      }}
    />
  );
}