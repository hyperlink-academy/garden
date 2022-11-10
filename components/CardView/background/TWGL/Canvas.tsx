import {
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms
} from 'twgl.js';

import { useEffect, useRef, useState } from 'react'; 
import { getUniforms as getColorUniforms, initProgram as initColorProgram } from './ColorPass';
import { getUniforms as getLightUniforms, initPrograms as initLightPrograms} from './LightPass';
import { getUniforms as getPatternUniforms, initPrograms as initPatternPrograms} from './PatternPass';
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
    const buffer0 = createFBO(gl,0);
    const p0 = firstPass.programInfo.program;

    //Init Programs&Buffers - Layer 1
    const secondPasses = initPatternPrograms(gl);
    const secondPass = data['grid'] ? secondPasses.grid : secondPasses.caustics;
    const buffer1 = createFBO(gl,0);
    const p1 = secondPass.programInfo.program;

    //Init Programs&Buffers - Layer 2

    //Init Programs&Buffers - Final
    const colorPass = initColorProgram(gl);
    const p3 = colorPass.programInfo.program;
   
    function render(time: number) {
      if (!gl?.canvas) return;
      var uniforms; var alluniforms;
      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
   
      //----------------------------------
      // Apply P0 and save it in buffer0
      gl.useProgram(p0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer0.fbo);
      //Update attributes & uniforms
      alluniforms = getLightUniforms(time, gl.canvas);
      uniforms = data['shadow'] ? alluniforms.shadow : alluniforms.light;
      setBuffersAndAttributes(gl, firstPass.programInfo, firstPass.bufferInfo);
      setUniforms(firstPass.programInfo, uniforms);
      //Render
      drawBufferInfo(gl, firstPass.bufferInfo);

      //Clean 
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.w, size.h);
      
      //----------------------------------
      // Apply P1 and save it in buffer1
      gl.useProgram(p1);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1.fbo);
      //Update attributes & uniforms
      alluniforms = getPatternUniforms(time, gl.canvas);
      uniforms = data['grid'] ? alluniforms.grid : alluniforms.caustics;
      setBuffersAndAttributes(gl, secondPass.programInfo, secondPass.bufferInfo);
      setUniforms(secondPass.programInfo, uniforms);
      //Render
      drawBufferInfo(gl, secondPass.bufferInfo);
      //Clean 
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, size.w, size.h);
      
      //----------------------------------
      // Apply P3 and render to canvas
      gl.useProgram(p3);
      uniforms = getColorUniforms(time, gl.canvas, {
        light: buffer0.texture,
        pattern: buffer1.texture,
        texture: buffer1.texture
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


  return <canvas width={'500px'} height={'500px'}  ref={canvasRef} />;
};
