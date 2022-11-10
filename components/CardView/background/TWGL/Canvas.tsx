import {
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms
} from 'twgl.js';

import { useEffect, useRef, useState } from 'react'; 
import { getUniforms as getColorUniforms, initProgram as initColorProgram} from './ColorPass';
import { getUniforms as getPatternUniforms, initProgram as initPatternProgram} from './PatternPass';

export const Canvas: React.FC = () => {
  const canvasRef = useRef();
  const [context, setContext] = useState < WebGLRenderingContext| null>();
  const [size, setSize] = useState({ w: 0, h: 0 });
  const onCanvasLoaded = () => {
    const gl = context;
    if (gl == null) return;
  
    //Init Programs
    const colorPass = initColorProgram(gl);
    const patternPass = initPatternProgram(gl);
    

    function render(time: number) {
      if (!gl?.canvas) return;

      resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
      gl.viewport(0, 0, size.w,size.h);

      
      const uniforms = getColorUniforms(time, gl.canvas);
      gl.useProgram(colorPass.programInfo.program);
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
