
const baseUrl = "https://script.google.com/macros/s/AKfycbwcTzKHICnBoy0hFiA1XCWQothe-kLwHiNvm6ecY2BBXnV4ZwoxBvcLC4ObGBGq4mTd/exec";
let headers = [];
let sheetData = [];
document.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(baseUrl);
  const json = await res.json();

  json.sheetNames.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    sheetSelect.appendChild(opt);
  });   await loadSheetData(sheetSelect.value);
});
async function loadSheetData(sheetName) {
    const container = document.getElementById("reloadSheet");
    container.innerHTML = `<i class="fas fa-sync-alt fa-spin fa-lg icon-loading"></i><span style="color:blue;"> Reload ${sheetName}!</span>`;
    try {
        const res = await fetch(`${baseUrl}?sheet=${sheetName}`);
        const json = await res.json();
        headers = json.headers;
        sheetData = json.data;
        container.innerHTML = `<i class="fas fa-check-circle fa-lg icon-success" style:"text-align: center;"> Reload Success!</i>`;
    } catch (error) {container.innerHTML = `<i class="fas fa-times-circle fa-lg icon-error">Lỗi Reload!</i>`;}
}
function displayData() {
    const rowIndex = parseInt(document.getElementById("rowInput").value) - 2;
    const container = document.getElementById("dataContainer");
    const row = sheetData[rowIndex] || [];
    let html = `<h2>Hàng số ${rowIndex + 2}</h2>`;
    headers.forEach((header, index) => {
        const value = row[index] || "";
        html += `
            <div class="section">
                <span>${header}</span>
                ${index === 5
                    ? `<div class="data-row"><input value="${value}" id="accountData${index}" readonly><button class="btn btn-copy" type="button" onclick="getCode()">Lấy Mã</button></div>
                        <div id="resultList"></div>`
                    : index === 6
                    ? `<div class="data-row"><input value="${value}" id="accountData${index}" readonly><button class="btn btn-copy" type="button" onclick="copyThenOpen('accountData${index}', '${value}')">Lấy Mã</button></div>`
                    : `<div class="data-row"><input value="${value}" id="accountData${index}" readonly><button class="btn btn-copy" type="button" onclick="copyText('accountData${index}', '${value}')"><i class="fas fa-copy"></i></button></div>`
                }
                <span id="feedback-accountData${index}" class="copy-feedback">Đã copy: ${header}!</span>
            </div>
        `;
    });
    container.innerHTML = html;
    }
function copyText(elementId, value) {
navigator.clipboard.writeText(value)
  .then(() => {
    const feedback = document.getElementById(`feedback-${elementId}`);
    if (feedback) {
      feedback.style.display = 'inline';
      feedback.style.opacity = '1';
      setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => feedback.style.display = 'none', 300);
      }, 1500);
    }
  })
  .catch(err => console.error('Lỗi sao chép:', err));
}
function copyThenOpen(elementId, value) {
copyText(elementId, value);
window.open("https://moakt.com/", "_blank");
}
async function getCode() {
const resultList = document.getElementById('resultList');
resultList.innerHTML = '';
const inputValue = document.getElementById("accountData5").value;
const codeDataList = inputValue
.split("\n")
.map(line => line.trim())
.filter(line => line);

if (codeDataList.length === 0) {
alert("Không có dữ liệu mã để xử lý!");
return;
}

for (let i = 0; i < codeDataList.length; i++) {
const rowData = codeDataList[i].split("|").map(part => part.trim());
if (rowData.length < 4) {      resultList.innerHTML += `<p style="color:red">Dữ liệu không hợp lệ tại dòng ${i + 1}: <b>${codeDataList[i]}</b></p>`;      continue;    }
try {
  const response = await fetch("https://tools.dongvanfb.net/api/get_messages_oauth2", {
    headers: {  accept: "*/*",  "content-type": "application/json"  },
    body: JSON.stringify({email: rowData[0],pass: rowData[1],refresh_token: rowData[2],client_id: rowData[3]}),method: "POST"
});
  const result = await response.json();
  const code = result.code || "Không có mã trả về";
  const inputId = `accountDataCode${i}`;
  resultList.innerHTML += `<div class="data-row"><input value="${code}" id="${inputId}" readonly><button onclick="copyText('${inputId}', '${code}')"><i class="fas fa-copy"></i></button></div>`;
} catch (error) {
  resultList.innerHTML += `<p style="color:red">Lỗi tại dòng ${i + 1}: ${error.message}</p>`;
}
}
}    
async function updateData(sheetName, rowIndex, updatedData) {
  const url = `${baseUrl}?sheet=${sheetName}&row=${rowIndex}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(updatedData)
  });
  const result = await response.json();
  if (result.success) {
    alert("Dữ liệu đã được cập nhật thành công!");
  } else {
    alert("Cập nhật dữ liệu thất bại: " + result.error);
  }
}
