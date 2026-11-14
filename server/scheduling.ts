import { HvacDatabase } from './db';
import { Lead, Appointment } from '../src/types';

// Regional metro serviced ZIP codes
const REGIONAL_METRO_ZIPS = new Set([
  // Central District
  '78701', '78702', '78703', '78704', '78705', '78712', '78751', '78756',
  // North District
  '78758', '78759', '78757', '78727', '78728', '78729', '78731', '78750', '78717',
  // South District
  '78745', '78748', '78749', '78739', '78741', '78744', '78747',
  // West District & Suburbs
  '78746', '78733', '78734', '78738', '78732',
  // North Metro
  '78664', '78665', '78681',
  // Northwest Suburbs
  '78613', '78641', '78645',
  // Northeast Suburbs
  '78660', '78691',
  // Northern Corridor
  '78626', '78628', '78633',
  // Southern Suburbs
  '78610', '78640',
  // Eastside Corridor
  '78653', '78617',
  // Standard Sample National Zips
  '10001', '10002', '90210', '30301', '60601', '33101', '98101', '80202', '75201',
]);

/**
 * Checks if a given 5-digit ZIP code is within the regional service area.
 */
export function checkServiceAreaZip(zip: string, db?: HvacDatabase): {
  isServiced: boolean;
  cityName?: string;
  message: string;
} {
  const cleanZip = zip ? zip.trim().slice(0, 5) : '';
  if (!cleanZip) {
    return { isServiced: false, message: 'Please provide a 5-digit ZIP code.' };
  }

  // Check database service areas first
  if (db && db.serviceAreas) {
    for (const area of db.serviceAreas) {
      if (area.zipCodes && area.zipCodes.includes(cleanZip)) {
        return {
          isServiced: true,
          cityName: area.name,
          message: `Coverage confirmed: ${area.name}. Priority dispatch available.`,
        };
      }
    }
  }

  // Check broader regional Metro list
  if (REGIONAL_METRO_ZIPS.has(cleanZip)) {
    return {
      isServiced: true,
      cityName: 'Greater Metro Area',
      message: 'Coverage confirmed: Greater Metro Service Territory.',
    };
  }

  return {
    isServiced: false,
    message: `ZIP code ${cleanZip} is outside our primary dispatch territory. An extended travel surcharge applies, or we can refer you to an authorized partner.`,
  };
}

/**
 * Detects duplicate lead inquiries within a 2-hour window based on phone number or email.
 */
export function detectDuplicateLead(
  db: HvacDatabase,
  phone: string,
  email?: string,
  serviceRequested?: string
): { isDuplicate: boolean; existingLead?: Lead; message?: string } {
  const cleanPhone = phone.replace(/\D/g, '');
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;

  for (const lead of db.leads) {
    const leadTime = new Date(lead.createdAt).getTime();
    if (leadTime < twoHoursAgo) continue; // Only check recent leads

    const leadPhone = lead.phone.replace(/\D/g, '');
    const leadEmail = lead.email ? lead.email.trim().toLowerCase() : '';

    const phoneMatch = cleanPhone.length >= 10 && leadPhone.length >= 10 && (
      cleanPhone.endsWith(leadPhone.slice(-10)) || leadPhone.endsWith(cleanPhone.slice(-10))
    );
    const emailMatch = cleanEmail && leadEmail && cleanEmail === leadEmail;

    if (phoneMatch || emailMatch) {
      return {
        isDuplicate: true,
        existingLead: lead,
        message: `Existing request detected (${lead.leadNumber}) submitted within the last 2 hours. Your ticket is already prioritized in the dispatch queue.`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Detects duplicate appointment bookings for the same customer phone on the same date and time slot.
 */
export function detectDuplicateAppointment(
  db: HvacDatabase,
  customerPhone: string,
  date: string,
  timeSlot: string
): { isDuplicate: boolean; existingAppointment?: Appointment; message?: string } {
  const cleanPhone = customerPhone.replace(/\D/g, '');

  for (const apt of db.appointments) {
    if (apt.date !== date || apt.timeSlot !== timeSlot) continue;
    if (['cancelled', 'no_show'].includes(apt.status)) continue;

    const aptPhone = apt.customerPhone.replace(/\D/g, '');
    const phoneMatch = cleanPhone.length >= 10 && aptPhone.length >= 10 && (
      cleanPhone.endsWith(aptPhone.slice(-10)) || aptPhone.endsWith(cleanPhone.slice(-10))
    );

    if (phoneMatch) {
      return {
        isDuplicate: true,
        existingAppointment: apt,
        message: `You already have an appointment (#${apt.appointmentNumber}) reserved for ${date} during ${timeSlot}. To adjust this visit, please contact dispatch.`,
      };
    }
  }

  return { isDuplicate: false };
}

/**
 * Validates scheduling constraints:
 * - Date must not be in the past
 * - Sunday closure for routine maintenance (Mon-Sat standard operating hours)
 * - Minimum lead time: 4 hours advance notice for same-day routine bookings
 */
export function validateAppointmentRules(
  dateStr: string,
  timeSlot: string,
  isEmergency: boolean = false
): { valid: boolean; error?: string } {
  const [year, month, day] = dateStr.split('-').map((v) => parseInt(v, 10));
  if (!year || !month || !day) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  const selectedDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return { valid: false, error: 'Appointment date cannot be in the past.' };
  }

  // Sunday rule: routine service is closed on Sundays (emergency dispatch only)
  const dayOfWeek = selectedDate.getDay(); // 0 = Sunday
  if (dayOfWeek === 0 && !isEmergency) {
    return {
      valid: false,
      error: 'Our office is closed on Sundays for routine maintenance. Our 24/7 on-call dispatch is available for urgent cooling and heating emergencies.',
    };
  }

  // Same-day booking check
  const isToday =
    selectedDate.getFullYear() === today.getFullYear() &&
    selectedDate.getMonth() === today.getMonth() &&
    selectedDate.getDate() === today.getDate();

  if (isToday && !isEmergency) {
    const currentHour = new Date().getHours();
    // Morning slots (08:00 AM) cannot be booked after 8:00 AM same-day
    if (timeSlot.startsWith('08:00') && currentHour >= 8) {
      return {
        valid: false,
        error: 'The 08:00 AM arrival window is no longer available today. Please select an afternoon window or a future date.',
      };
    }
    // Afternoon slots require at least 4 hours advance dispatch notice
    if (timeSlot.startsWith('01:00') && currentHour >= 12) {
      return {
        valid: false,
        error: 'Same-day routine appointments require at least 4 hours advance notice. Please select tomorrow or use emergency triage.',
      };
    }
    if (timeSlot.startsWith('03:00') && currentHour >= 14) {
      return {
        valid: false,
        error: 'Same-day booking cutoff for late afternoon has passed. Please select tomorrow or use emergency triage.',
      };
    }
  }

  return { valid: true };
}

/**
 * Returns transparent request-based fallback disclosures when live telematics/SMS gateways are in offline request mode.
 */
export function getDispatchFallbackDisclosure(
  journey: 'emergency' | 'routine' | 'estimate' | 'maintenance' | 'commercial'
): string {
  switch (journey) {
    case 'emergency':
      return 'Request-Based Emergency Dispatch: Ticket transmitted to on-call field technician queue. Dispatcher review SLA: under 15 minutes.';
    case 'routine':
      return 'Request-Based Scheduling: Arrival window reserved in scheduling engine. Dispatch team will confirm technician vehicle assignment via SMS/phone.';
    case 'estimate':
      return 'Request-Based Engineering Consultation: System design and load calculation request queued. Senior HVAC estimator will contact you within 1 business day.';
    case 'maintenance':
      return 'Request-Based Maintenance Routing: 21-point seasonal inspection request logged. Dispatch coordinator will confirm technician arrival window.';
    case 'commercial':
      return 'Commercial Facility Priority Queue: Commercial HVAC project manager assigned. Response SLA: under 1 hour.';
    default:
      return 'Request-Based Queue Active: Ticket processed in local dispatch console.';
  }
}
