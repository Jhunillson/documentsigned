const fileInput = document.getElementById('file-input');
const dragDropZone = document.getElementById('drag-drop-zone');
const browseBtn = document.getElementById('browse-btn');
const pdfCanvas = document.getElementById('pdf-render');
const signatureTools = document.getElementById('signature-tools');
const signatureInput = document.getElementById('signature-input');
const addSignatureBtn = document.getElementById('add-signature-btn');
const signatureImg = document.getElementById('signature-img');
const downloadContainer = document.getElementById('download-container');
const downloadBtn = document.createElement('button');

let pdfDoc = null;
const ctx = pdfCanvas.getContext('2d');

// Event listeners
browseBtn.onclick = () => fileInput.click();

fileInput.onchange = (e) => handleFiles(e.target.files);
dragDropZone.ondragover = (e) => e.preventDefault();
dragDropZone.ondrop = (e) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
};

function handleFiles(files) {
    if (files.length === 0 || !files[0].name.endsWith('.pdf')) {
        alert('Please upload a valid PDF file.');
        return;
    }
    const fileReader = new FileReader();
    fileReader.onload = (e) => renderPDF(e.target.result);
    fileReader.readAsArrayBuffer(files[0]);
}

function renderPDF(pdfData) {
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

    pdfjsLib.getDocument({ data: pdfData }).promise.then((pdf) => {
        pdfDoc = pdf;
        renderPage(1);
    });
}

function renderPage(num) {
    pdfDoc.getPage(num).then((page) => {
        const viewport = page.getViewport({ scale: 1.5 });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
        };
        page.render(renderContext).promise.then(() => {
            pdfCanvas.style.display = 'block';
            signatureTools.classList.remove('hidden');
        });
    });
}

addSignatureBtn.onclick = () => signatureInput.click();
signatureInput.onchange = (e) => handleSignature(e.target.files);

function handleSignature(files) {
    if (files.length === 0 || !(files[0].type === 'image/jpeg' || files[0].type === 'image/png')) {
        alert('Please upload a valid JPG or PNG signature.');
        return;
    }
    const fileReader = new FileReader();
    fileReader.onload = (e) => {
        signatureImg.src = e.target.result;
        signatureImg.classList.remove('hidden');
        makeSignatureDraggable();
        addDownloadButton();
    };
    fileReader.readAsDataURL(files[0]);
}

function makeSignatureDraggable() {
    let offsetX, offsetY;

    signatureImg.onmousedown = (e) => {
        offsetX = e.offsetX;
        offsetY = e.offsetY;
        document.onmousemove = (moveEvent) => {
            signatureImg.style.left = `${moveEvent.pageX - offsetX}px`;
            signatureImg.style.top = `${moveEvent.pageY - offsetY}px`;
        };
    };

    document.onmouseup = () => (document.onmousemove = null);
}

function addDownloadButton() {
    if (!downloadContainer.contains(downloadBtn)) {
        downloadBtn.textContent = 'Baixar o PDF Assinado!';
        downloadBtn.style.marginTop = '10px';
        downloadBtn.style.padding = '10px 15px';
        downloadBtn.style.background = '#28a745';
        downloadBtn.style.color = 'white';
        downloadBtn.style.border = 'none';
        downloadBtn.style.cursor = 'pointer';
        downloadBtn.style.borderRadius = '5px';

        downloadContainer.appendChild(downloadBtn);
        downloadBtn.onclick = downloadSignedPDF;
    }
}

function downloadSignedPDF() {
    const rect = signatureImg.getBoundingClientRect();
    const canvasRect = pdfCanvas.getBoundingClientRect();
    const x = rect.left - canvasRect.left;
    const y = rect.top - canvasRect.top;

    ctx.drawImage(signatureImg, x, y, signatureImg.width, signatureImg.height);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [pdfCanvas.width, pdfCanvas.height],
    });

    const imgData = pdfCanvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, pdfCanvas.width, pdfCanvas.height);

    pdf.save('signed-document.pdf');
}
