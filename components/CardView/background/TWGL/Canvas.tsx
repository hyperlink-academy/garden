import { drawBufferInfo, setBuffersAndAttributes, setUniforms } from "twgl.js";

import { useEffect, useRef, useState } from "react";
import {
  getUniforms as getColorUniforms,
  init as initColorProgram,
} from "./ColorPass";
import {
  getUniforms as getLightUniforms,
  initPrograms as initLightPrograms,
} from "./LightPass";
import {
  getUniforms as getPatternUniforms,
  initPrograms as initPatternPrograms,
} from "./PatternPass";
import {
  getUniforms as getTextureUniforms,
  initPrograms as initTexturePrograms,
} from "./TexturePass";

import {
  createFBO,
  Context,
  data,
  BufferInfo,
  applyProgramAndRenderToBuffer,
  updateFBO,
} from "./common";

type NoveltyParams = {
};

type CanvasProps = {
  width: number;
  height: number;
  quality: number;
  novelty: NoveltyParams;
};

export const Canvas = (props: CanvasProps) => {
  const canvasRef = useRef();
  const localDataRef = useRef();
  const [context, setContext] = useState<Context>();

  const { width, height, quality, novelty} = props;

  const buffersRef = useRef<BufferInfo[]>();

  const onCanvasLoaded = () => {
    const gl = context;
    if (gl === undefined) return;
    const buffers = buffersRef.current;
    if (buffers === undefined || !buffers[0] || !buffers[1] || !buffers[2])
      return;
    const localData = localDataRef.current;
    if (localData == undefined) return;

    //Init Programs&Buffers - Layer 0
    const firstPasses = initLightPrograms(gl);
    const firstPass = localData["shadow"]
      ? firstPasses.shadow
      : firstPasses.light;

    //Init Programs&Buffers - Layer 1
    const secondPasses = initPatternPrograms(gl);
    const secondPass = localData["grid"]
      ? secondPasses.grid
      : secondPasses.caustics;

    //Init Programs&Buffers - Layer 2
    const thirdPasses = initTexturePrograms(gl);
    const thirdPass = localData["diether"]
      ? thirdPasses.diether
      : thirdPasses.moire;

    //Init Programs&Buffers - Final
    const colorPass = initColorProgram(gl);

    function render(time: number) {
      const localData = localDataRef.current;

      if (localData === undefined) return;
      if (buffers === undefined) return;

      if (!gl?.canvas) return;

      var uniforms;
      var alluniforms;
      var canvas = gl.canvas as HTMLCanvasElement;

      const buffer0 = buffers[0];
      const buffer1 = buffers[1];
      const buffer2 = buffers[2];

      //----------------------------------
      // Apply P0 and save it in buffer0
      // Update attributes & uniforms
      alluniforms = getLightUniforms(time, gl.canvas);
      uniforms = localData["shadow"] ? alluniforms.shadow : alluniforms.light;

      applyProgramAndRenderToBuffer(gl, buffer0, uniforms, firstPass);

      //----------------------------------
      // Apply P1 and save it in buffer1
      alluniforms = getPatternUniforms(time, gl.canvas);
      uniforms = localData["grid"] ? alluniforms.grid : alluniforms.caustics;

      applyProgramAndRenderToBuffer(gl, buffer1, uniforms, secondPass);

      //----------------------------------
      // Apply P2 and save it in buffer2
      const prevTex = buffer1.texture as WebGLTexture;
      alluniforms = getTextureUniforms(time, gl.canvas, prevTex);
      uniforms = localData["diether"] ? alluniforms.diether : alluniforms.moire;

      applyProgramAndRenderToBuffer(gl, buffer2, uniforms, thirdPass);

      //----------------------------------
      // Apply P3 and render to canvas
      gl.useProgram(colorPass.programInfo.program);

      uniforms = getColorUniforms(time, gl.canvas, {
        light: buffer0.texture,
        pattern: buffer1.texture,
        texture: buffer2.texture,
      });
      setBuffersAndAttributes(gl, colorPass.programInfo, colorPass.bufferInfo);
      setUniforms(colorPass.programInfo, uniforms);

      drawBufferInfo(gl, colorPass.bufferInfo);

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
  };

  const resizeCanvas = (canvas: HTMLCanvasElement, gl: Context) => {
    canvas.width = width / quality;
    canvas.height = height / quality;

    canvas.style.width = width + "px";
    canvas.style.height =height + "px";

    gl.viewport(0, 0, width, height);
  };

  useEffect(() => {
    /** Initializing Canvas **/

    if (!canvasRef.current) return;
    const canvas = canvasRef.current as HTMLCanvasElement;

    //TODO: check params for WEBGL and test on multiple devices
    let params = {
      alpha: true,
      depth: false,
      stencil: false,
      antialias: true,
      preserveDrawingBuffer: false,
    };
    let gl = canvas.getContext("webgl2", params);

    let isWebGL2 = !!gl;
    if (!isWebGL2) {
      gl =
        canvas.getContext("webgl", params) ||
        canvas.getContext("experimental-webgl", params);
    }

    gl = gl as Context;

    setContext(gl);
    resizeCanvas(canvas, gl);

    buffersRef.current = [
      createFBO(gl, canvas.width, canvas.height),
      createFBO(gl, canvas.width, canvas.height),
      createFBO(gl, canvas.width, canvas.height),
    ];
    localDataRef.current = data;


    onCanvasLoaded();
  }, [canvasRef.current]);

  useEffect(() => {
     /** Updating Canvas and cleaning buffers **/
    if (!canvasRef.current) return;
    const canvas = canvasRef.current as HTMLCanvasElement;
    if (!context) return;
    resizeCanvas(canvas, context);

    if (!buffersRef.current) return;
    updateFBO(context, canvas.width, canvas.height, buffersRef.current[0]);
    updateFBO(context, canvas.width, canvas.height, buffersRef.current[1]);
    updateFBO(context, canvas.width, canvas.height, buffersRef.current[2]);
    context.viewport(0, 0, canvas.width, canvas.height);

  }, [canvasRef.current, width, height, quality])

  useEffect(() => {
    const localData = localDataRef.current;
    if (!localData) return;

    for (let key in novelty) {
      if (localData[key]) {
        localData[key] = novelty[key];
      }
    }
  

  }, [localDataRef.current, novelty])
  

  return <canvas ref={canvasRef} />;
};
