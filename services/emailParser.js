function parseEmailContent(htmlContent, plainTextContent) {
  const text = (plainTextContent || htmlContent?.replace(/<[^>]*>/g, '') || '').trim();
  
  // استخراج رقم المركبة (Vehicle)
  const vehicleMatch = text.match(/Vehicle\s*:\s*([^\n]+)/i);
  let truckNumber = vehicleMatch ? vehicleMatch[1].trim() : '';
  truckNumber = truckNumber.replace(/\s+/g, ' ').trim();

  // استخراج اسم السائق
  const driverMatch = text.match(/Driver Name\s*:\s*([^\n]+)/i);
  const driverName = driverMatch ? driverMatch[1].trim() : '';

  // استخراج التاريخ والوقت
  const dateMatch = text.match(/Date\s*:\s*([^\n]+)/i);
  const timeMatch = text.match(/Time\s*:\s*([^\n]+)/i);
  
  let detectedAt = new Date();
  let expectedArrival = null;
  
  if (dateMatch && timeMatch) {
    const dateStr = dateMatch[1].trim();
    const timeStr = timeMatch[1].trim();
    // تنسيق التاريخ: DD/MM/YYYY
    const [day, month, year] = dateStr.split('/');
    // تحويل الوقت (مثال: 09:57:29 AM)
    const timeLower = timeStr.toLowerCase();
    let hours = 0, minutes = 0, seconds = 0;
    const timeParts = timeLower.match(/(\d+):(\d+):(\d+)\s*(am|pm)/);
    if (timeParts) {
      let h = parseInt(timeParts[1]);
      minutes = parseInt(timeParts[2]);
      seconds = parseInt(timeParts[3]);
      const mod = timeParts[4];
      if (mod === 'pm' && h < 12) h += 12;
      if (mod === 'am' && h === 12) h = 0;
      hours = h;
    } else {
      // fallback للوقت بدون ثواني
      const simple = timeLower.match(/(\d+):(\d+)\s*(am|pm)/);
      if (simple) {
        let h = parseInt(simple[1]);
        minutes = parseInt(simple[2]);
        const mod = simple[3];
        if (mod === 'pm' && h < 12) h += 12;
        if (mod === 'am' && h === 12) h = 0;
        hours = h;
      }
    }
    detectedAt = new Date(Date.UTC(year, month-1, day, hours, minutes, seconds));
    if (!isNaN(detectedAt)) {
      expectedArrival = new Date(detectedAt.getTime() + 15 * 60000);
    } else {
      detectedAt = new Date();
      expectedArrival = new Date(Date.now() + 15*60000);
    }
  } else {
    expectedArrival = new Date(Date.now() + 15*60000);
  }

  // استخراج الحدث والموقع (اختياري)
  const eventMatch = text.match(/Event\s*:\s*([^\n]+)/i);
  const locationMatch = text.match(/Location\s*:\s*([^\n。]+)/i);
  
  return {
    truckNumber,
    driverName,
    detectedAt,
    expectedArrival,
    event: eventMatch ? eventMatch[1].trim() : '',
    location: locationMatch ? locationMatch[1].trim() : '',
    sourceEmail: 'service2dmm@jibal.sa'
  };
}

module.exports = { parseEmailContent };