// Contacto de la clínica contrastado con su sitio oficial y su ficha pública.
// Los horarios se mantienen pendientes hasta la confirmación del equipo.
export const contact: {
  whatsapp: string | null;
  address: string | null;
  hours: string | null;
  email: string | null;
  facebook: string;
  instagram: string;
} = {
  whatsapp: '+52 646 261 3142',
  address: 'Torre Imperial, Local 1, Calle Segunda 1765, Zona Centro, Ensenada, B.C., C.P. 22830',
  hours: null,
  email: 'idmaxilodentalclinic@gmail.com',
  facebook: 'https://www.facebook.com/p/IDMaxilo-Dental-Cl%C3%ADnic-61571091886254/',
  instagram: 'https://www.instagram.com/idmaxilo.dentalclinic/',
};

const digits = contact.whatsapp?.replace(/\D/g, '');
export const whatsappUrl = digits && /^\d{8,15}$/.test(digits)
  ? `https://wa.me/${digits}?text=${encodeURIComponent('Hola, me gustaría recibir información para una valoración en ID Maxilo.')}`
  : null;

export const mapUrl = contact.address
  ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contact.address)}`
  : null;
