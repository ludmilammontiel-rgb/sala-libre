export const HORAS = Array.from({ length: 19 }, (_, i) => {
  const minutos = 9 * 60 + 30 * i;
  return `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;
});
export const ZONA = 'America/Argentina/Buenos_Aires';
export const hoy = () => new Intl.DateTimeFormat('en-CA', {timeZone:ZONA, year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
// Argentina usa UTC−03; se construye instante ISO para enviar a timestamptz.
export const aISO = (fecha, hora) => `${fecha}T${hora}:00-03:00`;
export const fmtFecha = (fecha) => new Intl.DateTimeFormat('es-AR',{timeZone:ZONA,weekday:'short', day:'2-digit', month:'2-digit', year:'numeric'}).format(new Date(fecha));
export const fmtHora = (fecha) => new Intl.DateTimeFormat('es-AR',{timeZone:ZONA,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(fecha));
export const fmtFechaHora = (fecha) => `${fmtFecha(fecha)} · ${fmtHora(fecha)}`;
export function validarHorario(fecha, desde, hasta, personas) {
  if (!fecha || !desde || !hasta) return 'Completá todos los campos.';
  const d = new Date(`${fecha}T12:00:00-03:00`).getUTCDay();
  if (d === 0 || d === 6) return 'Solo se reserva de lunes a viernes.';
  if (desde >= hasta) return 'La hora de finalización debe ser posterior a la de inicio.';
  if (desde < '09:00' || hasta > '18:00') return 'Elegí un horario entre las 09:00 y las 18:00.';
  if (!Number.isInteger(Number(personas)) || Number(personas) < 1) return 'Indicá al menos una persona.';
  if (new Date(aISO(fecha,desde)) <= new Date()) return 'No podés reservar en el pasado.';
  return '';
}
export function mensajeError(error) {
  const t = error?.message || String(error || 'Ocurrió un error');
  if (error?.code === '23P01' || /exclusion|conflict|superpone/i.test(t)) return 'Ese horario acaba de ocuparse. Buscá otra sala u horario.';
  if (/JWT|session|not authenticated/i.test(t)) return 'Tu sesión venció. Volvé a ingresar.';
  return t;
}
