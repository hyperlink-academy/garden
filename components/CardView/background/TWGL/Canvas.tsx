import {
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms
} from 'twgl.js';

import { useEffect, useRef, useState } from 'react'; 
import { getUniforms as getColorUniforms, initProgram as initColorProgram} from './ColorPass';
import { getUniforms as getPatternUniforms, initProgram as initPatternProgram} from './PatternPass';
import { createFBO } from './WebGLHelper'


export const Canvas: React.FC = () => {
  const canvasRef = useRef();
  const [context, setContext] = useState < WebGLRenderingContext| null>();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onCanvasLoaded = () => {
    const gl = context;
    if (gl == null) return;
    const buffer0 = createFBO(gl);

    //Init Programs
    const colorPass = initColorProgram(gl);
    const patternPass = initPatternProgram(gl);

    const p0 = patternPass.programInfo.program;
    const p1 = colorPass.programInfo.program;
   
    function render(time: number) {
      if (!gl?.canvas) return;
      var uniforms;
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
   

      // Apply P0 and save it in buffer0. Texture is already bind to it
      gl.useProgram(p0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer0.fbo);
      //Update attributes & uniforms
      uniforms = getPatternUniforms(time, gl.canvas);
      setBuffersAndAttributes(gl, patternPass.programInfo, patternPass.bufferInfo);
      setUniforms(patternPass.programInfo, uniforms);
      // Save it to buffer0 
      drawBufferInfo(gl, patternPass.bufferInfo);

      //Clean 
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.w, size.h);

      // Apply P1 and render to canvas
      gl.useProgram(p1);
      uniforms = getColorUniforms(time, gl.canvas, buffer0.texture);
      setBuffersAndAttributes(gl, colorPass.programInfo, colorPass.bufferInfo);
      setUniforms(colorPass.programInfo, uniforms);
      
      drawBufferInfo(gl, colorPass.bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  };

  useEffect(() => {
    if (!canvasRef.current) return;
    const element = canvasRef.current as HTMLCanvasElement;

    let params = { alpha: true, depth: false, stencil: false, antialias: true, preserveDrawingBuffer: false };

    let gl = element.getContext('webgl2', params);
    let isWebGL2 = !!gl;
    if (!isWebGL2){ gl = element.getContext('webgl', params) || element.getContext('experimental-webgl', params); }

    setContext(gl);
    setSize({w: gl.canvas.width, h: gl.canvas.height});
    onCanvasLoaded();
  },[canvasRef.current])


  return <canvas width={window.innerWidth} height={'200px'}  ref={canvasRef} />;
};
