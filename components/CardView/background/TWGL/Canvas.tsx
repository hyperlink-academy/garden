import { useRef,useState,useEffect } from 'react';
import {
  createBufferInfoFromArrays,
  createProgramInfo,
  drawBufferInfo,
  resizeCanvasToDisplaySize,
  setBuffersAndAttributes,
  setUniforms,
} from 'twgl.js';

import {baseVertexShaderSource, colorFragmentShaderSource} from './twgl-shaders-test.js'

const useRequestAnimationFrame = (callback: Function) => {
  const requestRef = useRef() as any;
  const [previousTime, setTime] = useState(0.);

  const animate = (time: number) => {
    if (previousTime) callback(time - previousTime);
    setTime(time);
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, [previousTime]);
};


export function Canvas() {
  const [count, setCount] = useState(0.);
  const [buffer, setBuffer] = useState();
  const [programData, setProgramData] = useState<any>();

  const canvasRef = useRef();

  const render = (time: number) => {
    if (!canvasRef.current) return;
    const element = canvasRef.current as HTMLCanvasElement;
    const gl = element.getContext('webgl');

    if (!gl?.canvas) return;

    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const uniforms = {
      time: time * 0.001,
      resolution: [gl.canvas.width, gl.canvas.height],
    };

    gl.useProgram(programData.program);
    setBuffersAndAttributes(gl, programData, buffer);
    setUniforms(programData, uniforms);
    drawBufferInfo(gl, programData);
  }


  useEffect(() => {
    if (!canvasRef.current) return;
    const element = canvasRef.current as HTMLCanvasElement;
    const gl = element.getContext('webgl');

    if (gl == null) return;

    setProgramData(createProgramInfo(gl, [
      baseVertexShaderSource,
      colorFragmentShaderSource,
    ]));

    const arrays = {
      position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
    };
    const buffersFromArray = createBufferInfoFromArrays(gl, arrays) as any;
    setBuffer(buffersFromArray);
    
  }, [canvasRef.current]);
    


  useRequestAnimationFrame((deltaTime: number) => {
    setCount((prevCount: number) => (prevCount + deltaTime * 0.01) % 500);
    if (programData) { render(count); }
  });

  return <canvas style={{width:'700px'}} ref={canvasRef} />;
}
