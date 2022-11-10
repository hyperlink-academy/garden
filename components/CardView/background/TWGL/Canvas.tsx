import {
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms
} from 'twgl.js';

import { useEffect, useRef, useState } from 'react'; 
import { getUniforms as getColorUniforms, initProgram as initColorProgram } from './ColorPass';
import { getUniforms as getLightUniforms, initPrograms as initLightPrograms} from './LightPass';
import { getUniforms as getPatternUniforms, initProgram as initPatternProgram} from './PatternPass';
import { createFBO } from './WebGLHelper'
const data = require('../example.json');

export const Canvas: React.FC = () => {
  const canvasRef = useRef();
  const [context, setContext] = useState < WebGLRenderingContext| null>();
  const [size, setSize] = useState({ w: 0, h: 0 });

  const onCanvasLoaded = () => {
    const gl = context;
    if (gl == null) return;
   
    //Init Programs&Buffers - Layer 0
    const firstPasses = initLightPrograms(gl);
    const firstPass = data['shadow'] ? firstPasses.shadow : firstPasses.light;
    const buffer0 = createFBO(gl);
    const p0 = firstPass.programInfo.program;

    //Init Programs&Buffers - Layer 1
    const patternPass = initPatternProgram(gl);

    //Init Programs&Buffers - Layer 2

    //Init Programs&Buffers - Final
    const colorPass = initColorProgram(gl);
    const p3 = colorPass.programInfo.program;
   
    function render(time: number) {
      if (!gl?.canvas) return;
      var uniforms; var alluniforms;
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
   

      // Apply P0 and save it in buffer0. Texture is already bind to it
      gl.useProgram(p0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer0.fbo);
      //Update attributes & uniforms
      alluniforms = getLightUniforms(time, gl.canvas);
      uniforms = data['shadow'] ? alluniforms.shadow : alluniforms.light;
      setBuffersAndAttributes(gl, firstPass.programInfo, firstPass.bufferInfo);
      setUniforms(firstPass.programInfo, uniforms);
      // Save it to buffer0 
      drawBufferInfo(gl, firstPass.bufferInfo);

      //Clean 
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.w, size.h);

      // Apply P1 and render to canvas
      gl.useProgram(p3);
      uniforms = getColorUniforms(time, gl.canvas, {
        light: buffer0.texture,
        pattern: buffer0.texture,
        texture: buffer0.texture
      });
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
