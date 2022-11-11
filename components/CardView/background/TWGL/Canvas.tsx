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
import { getUniforms as getTextureUniforms, initPrograms as initTexturePrograms} from './TexturePass';


import { createFBO, data } from './common';
const DEBUG_RESOLUTION = false;


type CanvasProps = {
  width: number | null,
  height: number | null,
  quality: number | null
}

export const Canvas = (props: CanvasProps) => {
  const canvasRef = useRef();
  const [quality, setQuality] = useState(props.quality || 1);
  const [context, setContext] = useState<WebGLRenderingContext | null>();
  const [size ] = useState({ w: props.width || 500, h: props.height || 500 });
  const [buffers, setBuffers] = useState([null, null, null]);

  const [debug1, setDebug1] = useState('');
  const [debug2, setDebug2] = useState('');
  

  const onCanvasLoaded = () => {
    const gl = context;
    if (gl == null) return;
    if (!buffers[0] || !buffers[1] || !buffers[2]) return;

    //Init Programs&Buffers - Layer 0
    const firstPasses = initLightPrograms(gl);
    const firstPass = data['shadow'] ? firstPasses.shadow : firstPasses.light;
    const buffer0 = buffers[0]
    const p0 = firstPass.programInfo.program;

    //Init Programs&Buffers - Layer 1
    const secondPasses = initPatternPrograms(gl);
    const secondPass = data['grid'] ? secondPasses.grid : secondPasses.caustics;
    const buffer1 = buffers[1];
    const p1 = secondPass.programInfo.program;

    //Init Programs&Buffers - Layer 2
    const thirdPasses = initTexturePrograms(gl);
    const thirdPass = data['diether'] ? thirdPasses.diether : thirdPasses.moire;
    const buffer2 = buffers[2]
    const p2 = thirdPass.programInfo.program;

    //Init Programs&Buffers - Final
    const colorPass = initColorProgram(gl);
    const p3 = colorPass.programInfo.program;
   
    function render(time: number) {
      
      if (!gl?.canvas) return;
      var uniforms; var alluniforms;
      var canvas = gl.canvas as HTMLCanvasElement;
     // console.log("Canvas Size inside loop: ", canvas.width, canvas.height)
      resizeCanvasToDisplaySize(canvas);
   
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
      gl.viewport(0, 0, canvas.width, canvas.height);
      
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
      gl.viewport(0, 0, canvas.width, canvas.height);

      //----------------------------------
      // Apply P2 and save it in buffer2
      gl.useProgram(p2);
      gl.bindFramebuffer(gl.FRAMEBUFFER, buffer2.fbo);
      //Update attributes & uniforms
      alluniforms = getTextureUniforms(time, gl.canvas, buffer1.texture);
      uniforms = data['diether'] ? alluniforms.diether : alluniforms.moire;
      setBuffersAndAttributes(gl, thirdPass.programInfo, thirdPass.bufferInfo);
      setUniforms(thirdPass.programInfo, uniforms);
      //Render
      drawBufferInfo(gl, thirdPass.bufferInfo);
      //Clean 
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);

      //----------------------------------
      // Apply P3 and render to canvas
      gl.useProgram(p3);
      uniforms = getColorUniforms(time, gl.canvas, {
        light: buffer0.texture,
        pattern: buffer1.texture,
        texture: buffer2.texture
      });
      setBuffersAndAttributes(gl, colorPass.programInfo, colorPass.bufferInfo);
      setUniforms(colorPass.programInfo, uniforms);
      
      drawBufferInfo(gl, colorPass.bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  };
  
  const resizeCanvas = (element: HTMLCanvasElement, gl: WebGLRenderingContext) => {
    element.width =  size.w / quality;
    element.height = size.h / quality;
    setDebug1(`Canvas Resolution:${element.width, element.height}`);

    element.style.width = size.w + 'px';
    element.style.height = size.h + 'px';
    setDebug2(`Container Size: ${element.style.width, element.style.height}`);

    gl.viewport(0, 0, element.width, element.height);
   
    setBuffers([
      createFBO(gl, element.width, element.height),
      createFBO(gl, element.width, element.height),
      createFBO(gl, element.width, element.height)
    ])
  
  }

  useEffect(() => {
    var element = canvasRef.current;
    if (!element) return;
    if (!context) return;
    resizeCanvas(element, context);

  }, [quality])
  
  useEffect(() => {
    if (!canvasRef.current) return;
    const element = canvasRef.current as HTMLCanvasElement;

    //TODO: check params for WEBGL and test on multiple devices
    let params = { alpha: true, depth: false, stencil: false, antialias: true, preserveDrawingBuffer: false };
    let gl = element.getContext('webgl2', params);
    let isWebGL2 = !!gl;
    if (!isWebGL2) { gl = element.getContext('webgl', params) || element.getContext('experimental-webgl', params); }

    setContext(gl);
    resizeCanvas(element, gl);
   

    onCanvasLoaded();
  }, [canvasRef.current])


  return (<>
    <canvas id="glCanvas" ref={canvasRef} />
    {DEBUG_RESOLUTION ? (<>
    <button style={{ backgroundColor: 'black', color: 'white' }} onClick={() => setQuality(Math.max(0.1,quality - .5))}> [ + Resolution ] </button>
    .  
    <button style={{ backgroundColor: 'black', color: 'white' }} onClick={() => setQuality(quality + .5)}> [ - Resolution ] </button>
    <>
      <p>{debug1}</p>
      <p>{debug2}</p>
      </> 
    </>) : null}
    </>);
};

/** 
  DEBUG RESOLUTION:
  
  1. Updating state

  const useAnimationFrame = (callback: Function) => {
  const requestRef = useRef();
  const previousTimeRef = useRef();
  
  const animate = time => {
    if (previousTimeRef.current != undefined) {
    //  const deltaTime = time - previousTimeRef.current;
      callback(time)
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }
  
  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []);
}
**/
