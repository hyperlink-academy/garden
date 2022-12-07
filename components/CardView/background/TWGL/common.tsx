import {
  createProgramInfo,
  primitives,
  drawBufferInfo,
  setBuffersAndAttributes,
  setUniforms,
} from "twgl.js";

export type Pass = {
  programInfo: any;
};
export type BufferInfo = {
  fbo: WebGLFramebuffer | null;
  texture: WebGLTexture | null;
};

export type Context = WebGL2RenderingContext | WebGLRenderingContext;

function createTexture(gl: Context, texWidth: number, texHeight: number) {
  var texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    texWidth,
    texHeight,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    null
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  return texture;
}

export function createFBO(gl: Context, w: number, h: number) {
  const texture = createTexture(gl, w, h);
  // Create and bind the framebuffer
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  return {
    fbo,
    texture,
  };
}

export function updateFBO(
  gl: Context,
  w: number,
  h: number,
  target: BufferInfo
) {
  if (target.fbo && gl.isFramebuffer(target.fbo)) {
    gl.deleteFramebuffer(target.fbo);
  }

  if (target.texture && gl.isTexture(target.texture)) {
    gl.deleteTexture(target.texture);
  }

  gl.clear(gl.DEPTH_BUFFER_BIT);

  const bufferInfo = createFBO(gl, w, h);
  target.fbo = bufferInfo.fbo;
  target.texture = bufferInfo.texture;
}

export const initProgram = (gl: Context, fragmentSource: string) => {
  const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
    }`;

  const programInfo = createProgramInfo(gl, [
    baseVertexShaderSource,
    fragmentSource,
  ]);

  var bufferInfo = primitives.createXYQuadBufferInfo(gl);

  return {
    programInfo,
    bufferInfo,
  };
};

export const applyProgramAndRenderToBuffer = function (
  gl: Context,
  buffer: BufferInfo,
  uniforms: any,
  pass: Pass
) {
  const program = pass.programInfo.program as WebGLProgram;
  const canvas = gl.canvas;
  //Bind context to program to use
  gl.useProgram(program);
  gl.bindFramebuffer(gl.FRAMEBUFFER, buffer.fbo);
  //Update attributes & uniforms

  setBuffersAndAttributes(gl, pass.programInfo, pass.bufferInfo);
  setUniforms(pass.programInfo, uniforms);
  //Render
  drawBufferInfo(gl, pass.bufferInfo);

  //Clean
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, canvas.width, canvas.height);
};

export type Params = {
  time: number;
  shadow: boolean;
  light: boolean;
  "shadow-p": number;
  "shadow-r": number;
  "shadow-border": number;
  "light-peak": number;
  "light-intensity": number;
  "pattern-invert": number;
  "pattern-zoom": number;
  caustic: boolean;
  grid: boolean;
  "caustic-lumaSelection": number;
  "caustic-blur": number;
  "caustic-brightness": number;
  "caustic-contrast": number;
  "grid-perspective": number;
  "grid-wavysky": number;
  "grid-wavyhorizon": number;
  "grid-grounddensity": number;
  "grid-thicknessSky": {
    x: number;
    y: number;
  };
  "grid-thicknessGround": {
    x: number;
    y: number;
  };
  "texture-invert": number;
  diether: boolean;
  moire: boolean;
  "texture-flipY": number;
  "moire-polar": boolean;
  "moire-freqX": number;
  "moire-freqY": number;
  "moire-amountX": number;
  "moire-amountY": number;
  "background-color": {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  "layerZero-color": {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  layerZero: boolean;
  "layerOne-color": {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  layerOne: boolean;
  "layerTwo-color": {
    r: number;
    g: number;
    b: number;
    a: number;
  };
  layerTwo: boolean;
  "layers-offset": {
    x: number;
    y: number;
  };
  name: string;
};
