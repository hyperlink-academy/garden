 function createTexture(gl : WebGLRenderingContext) {
    var texture = gl.createTexture();
     gl.bindTexture(gl.TEXTURE_2D, texture);
    const texWidth = gl.canvas.width;
    const texHeight = gl.canvas.height;
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texWidth, texHeight, 0,
        gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    return texture;
 }

export function createFBO(gl: WebGLRenderingContext, idx: number) {
    const texture = createTexture(gl); 
    // Create and bind the framebuffer
    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, idx);
    
    return {
        fbo,
        texture
    }
    
}
