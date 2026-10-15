import { contact } from '../data/contact';
import { createFaceRenderer } from './face-renderer';

const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-treatment]'));
const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-panel]'));
function selectTreatment(id: string, focus = false) {
  tabs.forEach(tab => { const selected = tab.dataset.treatment === id; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; if (selected && focus) tab.focus({ preventScroll: true }); });
  panels.forEach(panel => { panel.hidden = panel.dataset.panel !== id; });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTreatment(tab.dataset.treatment!));
  tab.addEventListener('keydown', event => {
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault(); selectTreatment(tabs[next].dataset.treatment!, true);
  });
});
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Own anchor navigation so Safari never combines a native fragment scroll,
// focus scrolling and a panel's layout change into competing movements.
let anchorFrame = 0;
function cancelAnchorScroll() {
  cancelAnimationFrame(anchorFrame);
  anchorFrame = 0;
  document.documentElement.removeAttribute('data-anchor-scrolling');
}

document.addEventListener('click', event => {
  if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = event.target instanceof Element
    ? event.target.closest<HTMLAnchorElement>('a[href^="#"]')
    : null;
  if (!link || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
  const target = document.getElementById(decodeURIComponent(link.hash.slice(1)));
  if (!target) return;

  event.preventDefault();
  cancelAnchorScroll();
  const startY = window.scrollY;
  document.documentElement.setAttribute('data-anchor-scrolling', '');

  // Settle all layout changes before measuring the one scroll destination.
  closeMobileMenu();
  if (link.dataset.selectTreatment) selectTreatment(link.dataset.selectTreatment);
  const temporaryTabIndex = !target.hasAttribute('tabindex');
  if (temporaryTabIndex) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  if (temporaryTabIndex) target.removeAttribute('tabindex');

  if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
  window.scrollTo({ top: startY, behavior: 'instant' });

  const destination = () => {
    const inset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    return Math.min(maxY, Math.max(0, target.getBoundingClientRect().top + window.scrollY - inset));
  };
  const duration = reducedMotion ? 0 : Math.min(850, 300 + Math.abs(destination() - startY) * .1);
  let previousFrame: number | undefined;
  let elapsed = 0;
  const animate = (now: number) => {
    // Image decoding may delay a frame during a long trip. Don't turn that
    // delay into a large jump on the next frame, especially on mobile.
    if (previousFrame !== undefined) elapsed += Math.min(now - previousFrame, 32);
    previousFrame = now;
    const progress = duration ? Math.min(1, elapsed / duration) : 1;
    const eased = progress < .5
      ? 4 * Math.pow(progress, 3)
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    window.scrollTo({ top: startY + (destination() - startY) * eased, behavior: 'instant' });
    if (progress < 1) anchorFrame = requestAnimationFrame(animate);
    else cancelAnchorScroll();
  };
  anchorFrame = requestAnimationFrame(animate);
});

// A new gesture or history navigation takes over immediately.
for (const event of ['wheel', 'touchstart', 'pointerdown', 'popstate'] as const) {
  window.addEventListener(event, cancelAnchorScroll, { passive: true });
}
window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelAnchorScroll();
});

document.querySelectorAll<HTMLElement>('[data-mechanism]').forEach(mechanism => {
  const type = mechanism.dataset.mechanism;
  const top = mechanism.querySelector('[data-skin-top]')!;
  const front = mechanism.querySelector('[data-skin-front]')!;
  const side = mechanism.querySelector('[data-skin-side]')!;
  const lines = mechanism.querySelector('[data-surface-lines]')!;
  const svgNS = 'http://www.w3.org/2000/svg';
  const gridLines = Array.from({length: 12}, () => { const path = document.createElementNS(svgNS, 'path'); lines.appendChild(path); return path; });
  const button = mechanism.querySelector<HTMLButtonElement>('[data-action]')!;
  const state = mechanism.querySelector<HTMLElement>('.mechanism-state')!;
  const description = button.querySelector<HTMLElement>('[data-action-description]')!;
  const initialDescription = description.textContent!;
  let active = false, frame = 0, value = 0, playback = 0;
  function height(x: number, progress: number) {
    if (type === 'botox') return 174 + Math.sin((x - 60) / 30) * 13 * (1 - progress * .84);
    if (type === 'rellenos') return 174 + Math.exp(-Math.pow((x - 265) / 89, 2)) * (21 - progress * 38);
    return 171 + Math.sin((x - 70) / 120) * 35 * (1 - progress * .58) - progress * (x - 60) / 28;
  }
  const surfacePath = (progress: number, offsetX = 0, offsetY = 0) => {
    let d = `M${62+offsetX} ${height(62,progress)+offsetY}`;
    for (let x = 72; x <= 432; x += 10) d += ` L${x+offsetX} ${height(x,progress)+offsetY}`;
    return d;
  };
  const face = mechanism.querySelector<HTMLElement>('[data-face]')!;
  const portrait = createFaceRenderer(face, type!);
  const compare = mechanism.querySelector<HTMLButtonElement>('[data-face-compare]')!;
  let comparisonValue: number | null = null;
  function clearComparison() { comparisonValue = null; compare.textContent = 'Ver inicio'; compare.setAttribute('aria-pressed', 'false'); }
  const threads = Array.from(face.querySelectorAll('[data-face-thread]'));
  const steps = Array.from(mechanism.querySelectorAll<HTMLElement>('[data-face-step]'));
  const scrubber = mechanism.querySelector<HTMLInputElement>('[data-animation-scrub]')!;
  const phaseLabel = mechanism.querySelector<HTMLElement>('[data-animation-phase]')!;
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const smooth = (n: number) => { const t = clamp(n); return t * t * (3 - 2 * t); };
  let lastStep = -1;
  function renderFace(progress: number) {
    const action = smooth((progress - .18) / .64);
    const reveal = smooth((progress - .76) / .24);
    portrait.render(action);
    compare.disabled = progress === 0 && comparisonValue === null;
    face.style.setProperty('--face-action', String(action));
    face.style.setProperty('--face-progress', String(progress));
    face.style.setProperty('--face-reveal', String(reveal));
    face.dataset.progress = progress.toFixed(3);
    face.dataset.actionProgress = action.toFixed(3);
    const step = progress < .19 ? 0 : progress < .79 ? 1 : 2;
    face.dataset.phase = ['observe', 'action', 'reveal'][step];
    if (step !== lastStep) {
      steps.forEach((el, i) => { el.classList.toggle('is-current', i === step); el.classList.toggle('is-complete', i < step); });
      phaseLabel.textContent = progress === 0 ? 'Explora el cambio' : ['Observa la zona', 'Sigue el movimiento', 'Compara con el inicio'][step];
      lastStep = step;
    }
    scrubber.value = String(Math.round(progress * 100));
    scrubber.setAttribute('aria-valuetext', progress < .01 ? 'Concepto inicial' : progress > .99 ? 'Acción conceptual completa' : `${Math.round(progress * 100)} por ciento de la animación`);
    threads.forEach((path, i) => path.setAttribute('stroke-dashoffset', String(1 - smooth((progress - .18 - i * .07) / .32))));
  }
  function render(progress: number) {
    renderFace(progress);
    const tissueProgress = smooth((progress - .18) / .64);
    progress = tissueProgress;
    const near = surfacePath(progress); const far = surfacePath(progress,83,-52);
    const points:string[]=[];for(let x=432;x>=62;x-=10) points.push(`L${x+83} ${height(x,progress)-52}`);
    top.setAttribute('d',`${near} L515 ${height(432,progress)-52} ${points.join(' ')} Z`);
    front.setAttribute('d',`${near} L432 268 L62 233 Z`);
    side.setAttribute('d',`M432 ${height(432,progress)} L515 ${height(432,progress)-52} V218 L432 268 Z`);
    gridLines.forEach((line,i)=> {if(i<7){const x=92+i*50;line.setAttribute('d',`M${x} ${height(x,progress)} L${x+83} ${height(x,progress)-52}`);}else{const n=(i-6)/6;line.setAttribute('d',surfacePath(progress,n*83,-n*52));}});
    if (type === 'botox') {
      // Match the perspective of the skin's lower front edge (62,233 → 432,268).
      const skinEdgeSlope = (268 - 233) / (432 - 62);
      mechanism.querySelectorAll<SVGPathElement>('[data-muscle]').forEach((line, i) => {
        let d = '';
        for (let x = 105; x <= 380; x += 5) {
          const y = 245 + i * 4.5 + (x - 105) * skinEdgeSlope
            + Math.sin((x - 105) / 17) * (7 * (1 - progress) + 1);
          d += `${x === 105 ? 'M' : 'L'}${x} ${y}`;
        }
        line.setAttribute('d', d);
      });
    }
    if(type==='rellenos'){const filler=mechanism.querySelector('[data-filler]')!;filler.setAttribute('ry',String(7+progress*21));filler.setAttribute('cy',String(230-progress*9));filler.setAttribute('opacity',String(.4+progress*.6));}
    if(type==='hilos') mechanism.querySelectorAll<SVGPathElement>('[data-thread]').forEach((line,i)=> {const start=125+i*20,end=425+i*15;line.setAttribute('d',`M${start} ${229+i*9-progress*12} Q${275+i*12} ${259+i*8-progress*40} ${end} ${192+i*8-progress*19}`);});
  }
  function updateButton(isRunning: boolean) {
    button.dataset.active = String(active);
    button.dataset.running = String(isRunning);
    button.querySelector('[data-action-label]')!.textContent = isRunning ? 'Volver a empezar' : active ? 'Ver otra vez' : 'Ver cómo funciona';
    description.textContent = isRunning ? 'Sigue el cambio en ambas vistas' : active ? 'Repite la secuencia completa' : initialDescription;
    button.setAttribute('aria-label', `${active ? 'Repetir animación' : 'Ver cómo funciona'}: ${button.dataset.treatmentName}`);
  }
  render(0);
  button.addEventListener('click', async () => {
    const request = ++playback;
    cancelAnimationFrame(frame);
    await portrait.ready;
    if (request !== playback) return;
    clearComparison();
    active = true;
    value = 0;
    lastStep = -1;
    render(0);
    updateButton(true);
    state.textContent = 'Observa las tres etapas';
    const mobilePlayback = window.matchMedia('(max-width: 560px)').matches;
    if (mobilePlayback) mechanism.querySelector<HTMLElement>('[data-face-study]')!.scrollIntoView({ behavior: reducedMotion ? 'instant' : 'smooth', block: 'start' });
    const start = performance.now() + (mobilePlayback && !reducedMotion ? 450 : 0);
    function animate(now: number) {
      value = reducedMotion ? 1 : Math.max(0, Math.min(1, (now - start) / 2400));
      render(value);
      if (value < 1) frame = requestAnimationFrame(animate);
      else { updateButton(false); state.textContent = state.dataset.stateActive!; }
    }
    frame = requestAnimationFrame(animate);
  });
  compare.addEventListener('click', () => {
    playback++;
    cancelAnimationFrame(frame);
    if (comparisonValue === null) {
      comparisonValue = value;
      value = 0;
      compare.textContent = 'Ver cambio';
      compare.setAttribute('aria-pressed', 'true');
    } else {
      value = comparisonValue;
      clearComparison();
    }
    lastStep = -1;
    render(value);
    updateButton(false);
    state.textContent = comparisonValue !== null ? 'Vista inicial para comparar' : 'Comparación conceptual';
  });
  scrubber.addEventListener('input', () => {
    playback++;
    clearComparison();
    cancelAnimationFrame(frame);
    value = Number(scrubber.value) / 100;
    active = value > 0;
    lastStep = -1;
    render(value);
    updateButton(false);
    state.textContent = active ? 'Comparación conceptual' : state.dataset.stateDefault!;
  });

});
const menuButton=document.querySelector<HTMLButtonElement>('.menu-toggle')!;
const mobileNav=document.querySelector<HTMLElement>('#mobile-nav')!;
function closeMobileMenu() {
  mobileNav.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Abrir menú');
}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');mobileNav.hidden=!open;});
const dialog=document.querySelector<HTMLDialogElement>('#consultation-guide')!;
const openGuide=document.querySelector<HTMLButtonElement>('[data-open-guide]')!;
openGuide.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('dialog-open');});
dialog.querySelector('.dialog-close')!.addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();});
dialog.addEventListener('close',()=>{document.body.classList.remove('dialog-open');openGuide.focus();});
dialog.querySelector('.guide-download')!.addEventListener('click',()=>{
 const topic=dialog.querySelector<HTMLSelectElement>('#guide-topic')!.value;
 const content=`GUÍA PARA TU VALORACIÓN — ID MAXILO (nombre provisional)\n\nMe gustaría valorar: ${topic}\n\n1. LO QUE BUSCAS\nPiensa qué te gustaría mejorar y qué esperas de la atención.\n\n2. TU HISTORIA DE SALUD\nLleva información sobre medicamentos, alergias, tratamientos previos y estudios disponibles.\n\n3. LO QUE NECESITAS SABER\nPregunta por alternativas, límites, riesgos, cuidados y recuperación.\n\nEsta guía te ayuda a preparar tu consulta. No envía información ni programa una cita. Para consultar disponibilidad y solicitar una valoración, escribe al WhatsApp de la clínica: ${contact.whatsapp}.\n`;
 const url=URL.createObjectURL(new Blob([content],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='guia-valoracion-id-maxilo.txt';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);dialog.querySelector('.download-status')!.textContent='Tu guía está lista para guardar en este dispositivo.';
});
