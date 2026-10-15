/** A continuous displacement field: facial landmarks stay fixed while cheek tissue moves.
 * One WebGL draw per frame; the original image remains available if WebGL is unavailable.
 */
export function createFaceRenderer(face: HTMLElement, treatment: string) {
  const canvas = face.querySelector<HTMLCanvasElement>('[data-face-canvas]')!;
  const image = face.querySelector<HTMLImageElement>('[data-face-fallback]')!;
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false });
  let current = 0;
  let draw: ((action: number) => void) | undefined;
  const ready = (async () => {
    try {
      await image.decode();
      if (!gl) return;
      const shader = (type: number, source: string) => {
        const result = gl.createShader(type)!;
        gl.shaderSource(result, source);
        gl.compileShader(result);
        if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Face shader compilation failed');
        return result;
      };
      const vertex = shader(gl.VERTEX_SHADER, `
        attribute vec2 position;
        varying vec2 uv;
        void main() { uv=vec2(position.x*.5+.5,.5-position.y*.5); gl_Position=vec4(position,0.,1.); }
      `);
      const fragment = shader(gl.FRAGMENT_SHADER, `
        precision mediump float;
        varying vec2 uv;
        uniform sampler2D portrait;
        uniform float action;
        uniform float treatment;
        float zone(vec2 p, vec2 center, vec2 radius) {
          vec2 q=(p-center)/radius;
          float d=dot(q,q);
          // Compact support has no displacement outside the selected tissue.
          float f=max(0.,1.-d);
          return f*f*f;
        }
        vec2 displacement(vec2 p) {
          if(treatment < .5) return vec2(0.);
          float cheek=zone(p,vec2(278.,318.),vec2(100.,88.));
          // Keep the eye, nose, lips and central chin anchored in both treatments.
          float anchors=max(zone(p,vec2(319.,222.),vec2(78.,42.)),
                        max(zone(p,vec2(402.,285.),vec2(52.,65.)),
                            zone(p,vec2(380.,343.),vec2(65.,39.))));
          if(treatment < 1.5) {
            return vec2(-13.,-5.) * cheek * (action-.75) * (1.-anchors);
          }
          float jaw=zone(p,vec2(285.,377.),vec2(95.,65.));
          return (vec2(5.,18.)*cheek + vec2(1.,12.)*jaw) * (1.-action) * (1.-anchors);
        }
        void main() {
          vec2 p=uv*vec2(600.,700.);
          if(treatment > 1.5) p.x=600.-p.x;
          // Fixed point inverse mapping keeps the texture continuous at zone boundaries.
          vec2 source=p;
          for(int i=0;i<3;i++) source=p-displacement(source);
          vec4 color=texture2D(portrait,source/vec2(600.,700.));
          float cheek=zone(source,vec2(278.,318.),vec2(80.,65.));
          if(treatment > .5 && treatment < 1.5) color.rgb*=1.+(action-.75)*.085*cheek;
          gl_FragColor=color;
        }
      `);
      const program = gl.createProgram()!;
      gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Face program linking failed');
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
      const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      gl.uniform1i(gl.getUniformLocation(program,'portrait'),0);
      gl.uniform1f(gl.getUniformLocation(program,'treatment'),treatment==='botox'?0:treatment==='rellenos'?1:2);
      const progress=gl.getUniformLocation(program,'action');
      gl.viewport(0,0,canvas.width,canvas.height);
      draw=(action:number)=>{ gl.uniform1f(progress,action); gl.drawArrays(gl.TRIANGLES,0,6); };
      draw(current);
      face.dataset.ready='true';
      canvas.addEventListener('webglcontextlost', event=>{ event.preventDefault(); delete face.dataset.ready; draw=undefined; });
    } catch {
      // Retain the portrait and vector animation on unsupported devices or image errors.
      delete face.dataset.ready;
    }
  })();
  return { ready, render(action: number) { current=action; draw?.(action); } };
}
