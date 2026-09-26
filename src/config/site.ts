// Datos centrales del estudio. Todo cambio de contacto se hace acá.

export const site = {
  name: 'Estudio Técnico Soregaroli',
  shortName: 'Soregaroli',
  tagline: 'Estudio Técnico de Ascensores',
  description:
    'Habilitación de ascensores, Oblea QR Res. N.º 430, Libro Digital de Inspección, transferencias de titularidad, renovación de Permiso de Conservador y levantamiento de clausuras en CABA. Más de 40 años de experiencia ante el G.C.B.A.',
  keywords:
    'oblea QR, Resolución 430, habilitación de ascensores, libro digital de inspección, permiso de conservador, levantamiento de clausura, transferencia de titularidad, duplicado de expediente, estudio técnico ascensores, CABA, Caballito',
  location: 'CABA, Buenos Aires, Argentina',
  years: 40,
  phone: {
    display: '011 3647-0060',
    href: 'tel:+541136470060',
  },
  whatsapp: {
    // Formato internacional para celulares de Argentina: 54 9 + característica + número.
    number: '5491136470060',
    message: 'Hola, quisiera hacer una consulta sobre un trámite de ascensores.',
  },
  emails: ['estudiosoregaroli@gmail.com', 'estudiosoregaroli@hotmail.com'],
} as const;

export const whatsappUrl = (message: string = site.whatsapp.message) =>
  `https://wa.me/${site.whatsapp.number}?text=${encodeURIComponent(message)}`;

// Formulario: FormSubmit envía al correo principal y copia (_cc) al secundario.
// El primer envío dispara un email de activación a la casilla principal.
export const form = {
  endpoint: `https://formsubmit.co/ajax/${site.emails[0]}`,
  cc: site.emails.slice(1).join(','),
  subject: 'Nueva solicitud de cotización — web Soregaroli',
};

export const services = [
  'Oblea Código QR (Res. N.º 430)',
  'Habilitación',
  'Renovación Permiso de Conservador',
  'Transferencia de Titularidad',
  'Duplicado de Expediente',
  'Levantamiento de Clausura',
  'Libro Digital de Inspección',
  'Informe técnico / Auditoría',
  'Pericia judicial',
  'Otro',
] as const;
