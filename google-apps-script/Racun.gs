/**
 * Račun (A4, na slovenačkom) za firme i čuvanje potvrda i računa na Google Drajvu.
 *
 * Koji dokument ide uz mejl sa ulaznicama (meni „Pošalji potvrdu uplate"):
 *  - plaćeno „Na račun" + „Faktura na firmu" = DA  → RAČUN na ime firme (Racun.gs)
 *  - plaćeno „Na račun", bez fakture               → POTVRDA O UPLATI (Potvrda.gs)
 *  - gotovina ili način plaćanja nije upisan       → ništa (račun za gotovinu bi morao kroz davčnu blagajnu)
 *
 * Svaki dokument se čuva na Drajvu u fascikli „Sretenjski bal — potvrde i računi" (podfascikle „Računi" i
 * „Potrdila o plačilu"), a link se upisuje u kolonu „Potvrda/račun (Drive)". Ako je dokument već napravljen
 * (link postoji), ponovno slanje koristi isti fajl — broj računa se ne troši dvaput.
 *
 * Brojevi računa: GODINA-NNN (2027-001, 2027-002…), redom, po godini izdavanja; brojač je u Script Properties
 * (INVOICE_COUNTER_<godina>). Broj se troši tek kad je PDF uspešno napravljen. Ako društvo već ima račune
 * u toj godini, u Podešavanjima se upiše INVOICE_START (prvi slobodan broj).
 */

const DOCS_FOLDER_NAME = 'Sretenjski bal — potvrde i računi';
const DOCS_SUBFOLDERS = { invoice: 'Računi', receipt: 'Potrdila o plačilu' };
const INVOICE_SERVICE_DATE = '13. 2. 2027';
const INVOICE_VAT_NOTE = 'DDV ni obračunan na podlagi 1. odstavka 94. člena ZDDV-1.';

/** Da li je gost tražio račun na ime firme (kolona „Faktura na firmu" = DA). */
function invoiceRequested_(r) {
  return String(r.invoice || '').trim().toUpperCase() === 'DA';
}

/** 'invoice' | 'receipt' | null — koji dokument ide uz potvrdu uplate. */
function paymentDocumentKind_(r) {
  if (!receiptApplies_(r)) return null;
  return invoiceRequested_(r) ? 'invoice' : 'receipt';
}

// ── Brojevi računa ──────────────────────────────────────────────────────────

function invoiceYear_(now) {
  return Utilities.formatDate(now || new Date(), sheetTimeZone_(), 'yyyy');
}

/** Sledeći slobodan broj (bez trošenja): „2027-001". */
function peekInvoiceNumber_(settings, now) {
  const year = invoiceYear_(now);
  const last = parseInt(PropertiesService.getScriptProperties().getProperty('INVOICE_COUNTER_' + year), 10) || 0;
  const next = Math.max(last + 1, settings.invoiceStart || 1);
  return year + '-' + ('00' + next).slice(-Math.max(3, String(next).length));
}

/** Upisuje da je broj iskorišćen (posle uspešno napravljenog PDF-a). */
function commitInvoiceNumber_(number) {
  const m = String(number).match(/^(\d{4})-(\d+)$/);
  if (!m) return;
  const props = PropertiesService.getScriptProperties();
  const key = 'INVOICE_COUNTER_' + m[1];
  const n = parseInt(m[2], 10);
  if (n > (parseInt(props.getProperty(key), 10) || 0)) props.setProperty(key, String(n));
}

// ── Sadržaj računa ──────────────────────────────────────────────────────────

/** Sadržaj računa (bez crtanja) — da bi mogao da se proveri testovima. */
function invoiceData_(r, settings, paidAt, tickets, invoiceNumber, now) {
  const base = paymentReceiptData_(r, settings, 'sl', paidAt, tickets, now);
  const tz = sheetTimeZone_();
  const date = function (d) { return Utilities.formatDate(d, tz, 'd. M. yyyy'); };
  const company = companyFields_(r.company);
  if (!company.name) throw new Error('„' + COL.invoice + '" je DA, ali u koloni „' + COL.company + '" nema naziva firme.');
  const person = String(r.fullName || '').trim();
  const buyer = [company.address, company.country, company.taxId ? 'Davčna številka: ' + company.taxId : '', person ? 'Kontaktna oseba: ' + person : '']
    .filter(Boolean);
  return {
    number: String(invoiceNumber),
    reservation: String(r.number).trim(),
    buyerName: company.name,
    buyer: buyer,
    info: [
      ['Datum izdaje', date(now || new Date())],
      ['Kraj izdaje', 'Maribor'],
      ['Datum opravljene storitve', INVOICE_SERVICE_DATE],
      ['Datum plačila', date(paidAt)],
      ['Način plačila', 'nakazilo na TRR'],
      ['Rezervacija št.', String(r.number).trim()],
    ],
    lines: base.lines,
    total: base.total,
    paidLabel: 'Plačano ' + date(paidAt),
    zero: formatAmount_(0, settings.currency, 'sl'),
    fileName: 'Racun ' + invoiceNumber + '.pdf',
  };
}

// ── Crtanje (A4 = 595,3 × 841,9 pt), izgled kao odobreni vzorec u Wordu ────────────────────────

function invoicePdf_(r, settings, paidAt, tickets, invoiceNumber) {
  const d = invoiceData_(r, settings, paidAt, tickets, invoiceNumber);
  const id = DriveApp.getFileById(slidesTemplateId_(RECEIPT_TEMPLATE_PROP, RECEIPT_TEMPLATE_NAME, RECEIPT_TEMPLATE_PPTX_BASE64))
    .makeCopy('Račun ' + d.number + ' (privremeno)').getId();
  try {
    const deck = SlidesApp.openById(id);
    const slide = deck.getSlides()[0] || deck.appendSlide(SlidesApp.PredefinedLayout.BLANK);
    slide.getPageElements().forEach(function (e) { e.remove(); });
    slide.getBackground().setSolidFill('#ffffff');
    const text = function (s, x, cy, w, size, font, weight, color, align) {
      return receiptText_(slide, s, x, cy, w, size, font, weight, color, align);
    };
    const rule = function (x1, y, x2, color) { receiptLine_(slide, x1, y, x2, color || RECEIPT_RULE); };
    const label = function (s, x, y, w) { text(spaced_(s), x, y, w, 7.1, 'Manrope', 600, TICKET_PDF_BRASS); };
    const R = RECEIPT_R;

    // Izdavalac
    text(RECEIPT_ORGANIZER, RECEIPT_X, 58, 330, 12.5, 'Playfair Display', 400, TICKET_PDF_WINE);
    text('Zagrebška cesta 20, 2000 Maribor, Slovenija', RECEIPT_X, 76, 330, 8.6, 'Manrope', 400, TICKET_PDF_SOFT);
    text('info@kcsretenje.si · sretenjskibal.si', RECEIPT_X, 89, 330, 8.6, 'Manrope', 400, TICKET_PDF_SOFT);
    const orgRight = ['Matična številka: 2949903000', 'Davčna številka: 41959787', 'Ni zavezanec za DDV'];
    if (settings.iban) orgRight.push('IBAN: ' + settings.iban);
    if (settings.bic) orgRight.push('BIC: ' + settings.bic);
    orgRight.forEach(function (s, i) { text(s, R - 200, 56 + i * 12.2, 200, 7.8, 'Manrope', 400, TICKET_PDF_SOFT, 'right'); });

    // Naslov
    text('Račun št. ' + d.number, RECEIPT_X, 146, 420, 21, 'Playfair Display', 400, TICKET_PDF_WINE);
    rule(RECEIPT_X, 164, R, TICKET_PDF_BRASS);

    // Kupec | Podatki o računu
    const col2 = 330;
    label('Kupec', RECEIPT_X, 190, 250);
    label('Podatki o računu', col2, 190, 200);
    text(d.buyerName, RECEIPT_X, 208, 260, d.buyerName.length > 38 ? 10.5 : 12, 'Playfair Display', 400, TICKET_PDF_INK);
    d.buyer.forEach(function (s, i) { text(s, RECEIPT_X, 225 + i * 14.1, 260, 9.2, 'Manrope', 400, RECEIPT_TEXT_COLOR); });
    d.info.forEach(function (row, i) {
      text(row[0], col2, 208 + i * 15.2, 130, 9, 'Manrope', 400, TICKET_PDF_SOFT);
      text(row[1], col2 + 110, 208 + i * 15.2, R - col2 - 110, 9, 'Manrope', 600, TICKET_PDF_INK, 'right');
    });
    let y = Math.max(225 + d.buyer.length * 14.1, 208 + d.info.length * 15.2) + 22;

    // Postavke
    const cols = [[RECEIPT_X, 22, 'left'], [74, 280, 'left'], [360, 50, 'right'], [416, 60, 'right'], [482, R - 482, 'right']];
    ['Št.', 'Opis', 'Količina', 'Cena', 'Znesek'].forEach(function (c, i) {
      text(spaced_(c), cols[i][0], y + 3.6, cols[i][1], 7.1, 'Manrope', 600, RECEIPT_BRASS_DARK, cols[i][2]);
    });
    y += 15;
    rule(RECEIPT_X, y, R);
    d.lines.forEach(function (l, n) {
      [String(n + 1) + '.', l.desc, l.qty, l.unit, l.sum].forEach(function (s, i) {
        if (s) text(s, cols[i][0], y + 16.4, cols[i][1], 9.2, 'Manrope', 400, TICKET_PDF_INK, cols[i][2]);
      });
      y += 32.8;
      rule(RECEIPT_X, y, R, RECEIPT_RULE_SOFT);
    });

    // Skupaj
    const tot = function (k, v, size, weight, color) {
      text(k, 300, y, 160, size, 'Manrope', weight, color, 'right');
      text(v, 470, y, R - 470, size, 'Manrope', weight, color, 'right');
    };
    y += 18; tot('Skupaj', d.total, 9.2, 400, TICKET_PDF_INK);
    y += 16; tot('DDV', 'ni obračunan', 9.2, 400, TICKET_PDF_SOFT);
    y += 12; rule(300, y, R, TICKET_PDF_BRASS);
    y += 18; tot('Za plačilo', d.total, 13, 600, TICKET_PDF_WINE);
    y += 20; tot(d.paidLabel, d.total, 9.2, 400, TICKET_PDF_SOFT);
    y += 16; tot('Ostane za plačilo', d.zero, 9.2, 600, TICKET_PDF_INK);

    // Napomena
    y += 40;
    text(INVOICE_VAT_NOTE, RECEIPT_X, y, R - RECEIPT_X, 9, 'Manrope', 400, TICKET_PDF_INK).getText().getTextStyle().setItalic(true);
    text('Račun je v celoti plačan. Hvala za obisk Sretenjskega bala.', RECEIPT_X, y + 15, R - RECEIPT_X, 9, 'Manrope', 400, TICKET_PDF_SOFT);

    // Podnožje
    rule(RECEIPT_X, 790.5, R);
    text(RECEIPT_ORGANIZER + ' · Zagrebška cesta 20, 2000 Maribor · info@kcsretenje.si', RECEIPT_X, 810.8, R - RECEIPT_X, 7.5, 'Manrope', 400, TICKET_PDF_SOFT);

    deck.saveAndClose();
    return DriveApp.getFileById(id).getAs('application/pdf').setName(d.fileName);
  } finally {
    try {
      DriveApp.getFileById(id).setTrashed(true);
    } catch (err) {
      console.error('Privremena prezentacija ' + id + ' nije obrisana: ' + err.message);
    }
  }
}

// ── Drajv ────────────────────────────────────────────────────────────────────

function documentsFolder_(kind) {
  const props = PropertiesService.getScriptProperties();
  let root = null;
  const id = props.getProperty('DOCS_FOLDER_ID');
  if (id) {
    try {
      const f = DriveApp.getFolderById(id);
      if (!f.isTrashed()) root = f;
    } catch (err) {
      // fascikla obrisana — pravimo novu
    }
  }
  if (!root) {
    const found = DriveApp.getFoldersByName(DOCS_FOLDER_NAME);
    root = found.hasNext() ? found.next() : DriveApp.createFolder(DOCS_FOLDER_NAME);
    props.setProperty('DOCS_FOLDER_ID', root.getId());
  }
  const name = DOCS_SUBFOLDERS[kind];
  const sub = root.getFoldersByName(name);
  return sub.hasNext() ? sub.next() : root.createFolder(name);
}

/** ID fajla iz linka u koloni „Potvrda/račun (Drive)", ili ''. */
function documentFileId_(url) {
  const m = String(url || '').match(/\/d\/([\w-]{20,})|[?&]id=([\w-]{20,})/);
  return m ? m[1] || m[2] : '';
}

/**
 * Napravi (ili ponovo uzme sa Drajva) dokument za potvrdu uplate.
 * Vraća { kind, blob, url, invoiceNumber, saveError } ili null kad dokument ne ide (gotovina…).
 */
function paymentDocument_(r, settings, paidAt, tickets) {
  const kind = paymentDocumentKind_(r);
  if (!kind) return null;
  const invoiceNumber = kind === 'invoice' ? String(r.invoiceNumber || '').trim() : '';

  // Već napravljen dokument (ponovno slanje): isti fajl, isti broj računa.
  const existing = documentFileId_(r.document);
  if (existing) {
    try {
      const file = DriveApp.getFileById(existing);
      if (!file.isTrashed()) return { kind: kind, blob: file.getBlob(), url: file.getUrl(), invoiceNumber: invoiceNumber, saveError: '' };
    } catch (err) {
      // fajl obrisan — pravi se ponovo
    }
  }

  const n = String(r.number).trim();
  let blob;
  let driveName;
  let number = invoiceNumber;
  if (kind === 'invoice') {
    number = number || peekInvoiceNumber_(settings);
    blob = invoicePdf_(r, settings, paidAt, tickets, number);
    commitInvoiceNumber_(number);
    driveName = 'Račun ' + number + ' — ' + companyFields_(r.company).name + ' (rezervacija ' + n + ').pdf';
  } else {
    blob = paymentReceiptPdf_(r, settings, RECEIPT_LANG, paidAt, tickets);
    driveName = 'Potrdilo o plačilu ' + n + ' — ' + String(r.fullName || '').trim() + '.pdf';
  }
  let url = '';
  let saveError = '';
  try {
    const file = documentsFolder_(kind).createFile(blob.copyBlob());
    file.setName(driveName);
    url = file.getUrl();
  } catch (err) {
    saveError = err.message;
    console.error('Dokument za ' + r.number + ' nije sačuvan na Drajvu: ' + err.message);
  }
  return { kind: kind, blob: blob, url: url, invoiceNumber: number, saveError: saveError };
}

// ── Meni ─────────────────────────────────────────────────────────────────────

/**
 * Za rezervacije kojima je potvrda uplate već poslata, a dokument nije na Drajvu: napravi potvrdu ili račun
 * i sačuva ga (bez slanja mejlova). Za firme koje su tražile račun, račun treba poslati ručno.
 */
function menuSaveDocumentsToDrive() {
  const ui = SpreadsheetApp.getUi();
  if (ui.alert('Potvrde i računi na Drajv',
    'Za sve rezervacije kojima je potvrda uplate već poslata (plaćeno na račun), a potvrda/račun još nije na Drajvu, ' +
    'skripta će napraviti dokument i sačuvati ga u fascikli „' + DOCS_FOLDER_NAME + '".\n\nGostima se NIŠTA ne šalje. Nastaviti?',
    ui.ButtonSet.YES_NO) !== ui.Button.YES) return;
  const settings = readSettings_();
  const t = openTable_();
  const todo = t.rows
    .map(function (row) { return rowToObj_(t, row); })
    .filter(function (r) {
      return normStatus_(r.status) === STATUS.PAID && parseDate_(r.paymentConfirmedAt) && paymentDocumentKind_(r) && !documentFileId_(r.document);
    })
    .map(function (r) { return String(r.number).trim(); });
  const done = [];
  const invoices = [];
  const errors = [];
  todo.forEach(function (n) {
    try {
      updateReservation_(n, function (r) {
        const doc = paymentDocument_(r, settings, parseDate_(r.paidAt) || new Date(), issueTickets_(r));
        if (!doc) return null;
        if (doc.saveError) errors.push(n + ': ' + doc.saveError);
        else done.push(n);
        if (doc.kind === 'invoice') invoices.push(n + ' (račun ' + doc.invoiceNumber + ')');
        const fields = { document: doc.url };
        if (doc.invoiceNumber) fields.invoiceNumber = doc.invoiceNumber;
        return fields;
      });
    } catch (err) {
      errors.push(n + ': ' + err.message);
    }
  });
  ui.alert(
    (done.length ? 'Sačuvano na Drajv: ' + done.length + ' (' + done.join(', ') + ').' : 'Nema novih dokumenata za čuvanje.') +
    (invoices.length ? '\n\nNapravljeni su računi za firme — pošaljite ih firmama ručno (link je u koloni „' + COL.document + '"): ' + invoices.join(', ') : '') +
    (errors.length ? '\n\nGreške:\n- ' + errors.join('\n- ') : ''),
  );
}

/** Meni: probni račun (izmišljena firma) na adresu organizatora; ne troši broj i ne čuva se na Drajvu. */
function menuTestInvoicePdf() {
  const ui = SpreadsheetApp.getUi();
  const s = readSettings_();
  try {
    const sample = {
      number: '0000', fullName: 'Ana Novak', email: 'ana.novak@example.com', ticketCount: 3,
      amount: (Number(s.prices.SVECANA) || 140) * 2 + (Number(s.prices.GALERIJA) || 70), paymentMethod: 'Na račun', invoice: 'DA',
      company: 'Naziv: Vzorec d.o.o.\nSedež: Slovenska ulica 1, 1000 Ljubljana\nDržava: Slovenija\nDavčna številka: SI12345678',
    };
    const tickets = [{ type: TICKET_TYPES.SVECANA }, { type: TICKET_TYPES.SVECANA }, { type: TICKET_TYPES.GALERIJA }];
    const pdf = invoicePdf_(sample, s, new Date(), tickets, 'PROBA');
    sendMail_(s, {
      to: s.adminEmail,
      subject: 'Sretenjski bal — probni račun',
      body: 'U prilogu je probni račun (izmišljena firma, broj „PROBA").',
      attachments: [pdf],
    });
    ui.alert('Probni račun je poslat na ' + s.adminEmail + '.');
  } catch (err) {
    ui.alert('Probni račun NIJE napravljen: ' + err.message);
  }
}
