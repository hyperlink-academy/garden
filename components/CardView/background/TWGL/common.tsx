import {
    createProgramInfo,
    primitives,
    drawBufferInfo,
    setBuffersAndAttributes,
    setUniforms
} from 'twgl.js';

export const data = require('../configuration-multicolor-dither-wavy-grid.json'); 

export type Pass = {
    programInfo: any, //TODO: Check types of createProgramInfo
}   
export type BufferInfo = {
    fbo: WebGLFramebuffer| null,
    texture:  WebGLTexture | null,
} 

export type Context = WebGL2RenderingContext | WebGLRenderingContext;



function createTexture(gl: Context, texWidth: number, texHeight: number) {
    var texture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    return texture;
 }

export function createFBO(gl: Context, w: number, h: number) {
    const texture = createTexture(gl,w,h); 
    // Create and bind the framebuffer
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    
    return {
        fbo,
        texture
    }
    
}

export const initProgram = (gl: Context, fragmentSource: string) => {

    const baseVertexShaderSource = `attribute vec4 position;
    attribute vec2 texcoord;
    varying vec2 vUv;

    void main() {
        vUv = texcoord;
        gl_Position = position;
    }`
    
    const programInfo = createProgramInfo(gl, [
        baseVertexShaderSource,
        fragmentSource
    ]);
   
      var bufferInfo = primitives.createXYQuadBufferInfo(gl);
 
 
    return {
        programInfo,
        bufferInfo
      }
}


export const applyProgramAndRenderToBuffer= function(
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
}
