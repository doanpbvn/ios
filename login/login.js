// Sheet Manager - Improved Version
class SheetManager {
    constructor() {
        this.qrText = "https://doanpbvn.github.io/ios/doan_login.html";
        this.headers = [];
        this.sheetData = [];
        this.selectedSheet = "";
        this.currentRowIndex = 0;
        this.elements = {};
        
        this.init();
    }

    async init() {
        this.initQRCode();
        this.cacheElements();
        this.bindEvents();
        await this.loadSheetList();
    }

    initQRCode() {
        const qrElement = document.getElementById("qrcode");
        if (qrElement) {
            new QRCode(qrElement, this.qrText);
        }
    }

    cacheElements() {
        this.elements = {
            sheetNameContainer: document.getElementById("SheetName"),
            reloadSheet: document.getElementById("reloadSheet"),
            dataContainer: document.getElementById("dataContainer")
        };
    }

    bindEvents() {
        document.addEventListener("DOMContentLoaded", () => this.loadSheetList());
        
        // Event delegation for all dynamic elements
        if (this.elements.dataContainer) {
            this.elements.dataContainer.addEventListener("click", (e) => this.handleContainerClick(e));
        }
    }

    async loadSheetList() {
        try {
            const response = await this.fetchWithErrorHandling(baseUrl);
            const data = await response.json();

            this.renderSheetOptions(data.sheetNames);
            
            // Auto-select first sheet
            if (data.sheetNames.length > 0) {
                this.selectedSheet = data.sheetNames[0];
                await this.loadSheetData(this.selectedSheet);
            }
        } catch (error) {
            this.showError("reloadSheet", `Lỗi tải danh sách sheet: ${error.message}`);
        }
    }

    renderSheetOptions(sheetNames) {
    if (!this.elements.sheetNameContainer) return;
    
    // Xóa nội dung hiện tại
    this.elements.sheetNameContainer.innerHTML = "";

    // Tạo thẻ <select>
    const select = document.createElement("select");
    select.id = "sheetSelect";
    select.classList.add("sheet-dropdown");

    // Thêm các tùy chọn vào dropdown
    sheetNames.forEach((name, index) => {
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        if (index === 0) option.selected = true;
        select.appendChild(option);
    });

    // Gán sự kiện khi thay đổi tùy chọn
    select.addEventListener("change", async () => {
        this.selectedSheet = select.value;
        await this.loadSheetData(this.selectedSheet);
    });

    // Thêm dropdown vào container
    this.elements.sheetNameContainer.appendChild(select);
}


    createSheetOption(name, isDefault = false) {
        const label = document.createElement("label");
        label.htmlFor = `sheet-${name}`;
        
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "sheetRadio";
        radio.value = name;
        radio.id = `sheet-${name}`;
        radio.checked = isDefault;
        
        radio.addEventListener("change", async () => {
            if (radio.checked) {
                this.selectedSheet = name;
                await this.loadSheetData(name);
            }
        });
        
        label.appendChild(radio);
        label.appendChild(document.createTextNode(` ${name}`));
        
        return label;
    }

    async loadSheetData(sheetName) {
        this.showLoadingStatus(`Load Account: ${sheetName}...`);
        
        try {
            const url = `${baseUrl}?sheet=${encodeURIComponent(sheetName)}`;
            const response = await this.fetchWithErrorHandling(url);
            const data = await response.json();

            this.headers = data.headers || [];
            this.sheetData = data.data || [];
            this.currentRowIndex = this.findFirstEmptyRow();

            this.showSuccessStatus(`Load Xong: ${sheetName}`);
            this.displayData(this.currentRowIndex);
            
        } catch (error) {
            this.showError("reloadSheet", `Lỗi: ${error.message}`);
            this.clearDataContainer();
        }
    }

    findFirstEmptyRow() {
        const emptyRowIndex = this.sheetData.findIndex(row => !row[1]);
        return emptyRowIndex === -1 ? 0 : emptyRowIndex;
    }

    displayData(rowIndex) {
        if (!this.isValidRowIndex(rowIndex)) {
            this.showInvalidRowMessage();
            return;
        }

        this.currentRowIndex = rowIndex;
        const row = this.sheetData[rowIndex];
        
        if (this.elements.dataContainer) {
            this.elements.dataContainer.innerHTML = this.createSectionHTML(rowIndex, row);
            this.setupRowEventListeners(rowIndex);
        }
    }

    isValidRowIndex(rowIndex) {
        return this.sheetData.length > 0 && rowIndex >= 0 && rowIndex < this.sheetData.length;
    }

    showInvalidRowMessage() {
        if (this.elements.dataContainer) {
            this.elements.dataContainer.innerHTML = this.sheetData.length === 0 
                ? "<div class='section'><h3>Không có dữ liệu để hiển thị.</h3></div>"
                : "<div class='section'><h3>Hàng không hợp lệ.</h3></div>";
        }
    }

    createSectionHTML(rowIndex, row) {
        const navigationButtons = this.createNavigationButtons(rowIndex);
        const dataBlocks = this.createDataBlocks(rowIndex, row);
        
        return navigationButtons + dataBlocks;
    }

    createNavigationButtons(rowIndex) {
        return `
            <div class="navigation-section">
              <button class="btn" id="loadSheetData" onclick="sheetManager.loadSheetData('${this.selectedSheet}')"><i class="fas fa-sync-alt"></i> Tải lại dữ liệu</button>
              <button class="btn" id="doneButton-${rowIndex}">Đánh dấu là đã làm!</button>
              <p>Hàng ${rowIndex + 2}</p>
              <label>
                <button class="btn" id="prevBtn" ${rowIndex <= 0 ? "disabled" : ""}>Hàng trước</button>
                <button class="btn" id="nextBtn" ${rowIndex >= this.sheetData.length - 1 ? "disabled" : ""}>Hàng sau</button>
            </label>
            </div>
        `;
    }

    createDataBlocks(rowIndex, row) {
        return this.headers.map((header, index) => {
            if (index === 0) return ""; // Skip first column
            
            const value = row[index] || "";
            
            switch (index) {
                case 1: // URL column
                    return this.createUrlBlock(rowIndex, index, header, value);
                case 3: // 2FA column
                    return this.create2FABlock(rowIndex, index, header, value);
                default:
                    return this.createCopyableBlock(rowIndex, index, header, value);
            }
        }).join("");
    }

    createUrlBlock(rowIndex, index, header, value) {
        const displayValue = value.trim() === "" ? "Chưa có dữ liệu!" : value;
        return `
            <div id="block-${rowIndex}">
                <h4>${index} : ${header}</h4>
                <input class="textURL" value="${displayValue}" id="accountData-${rowIndex}-${index}" readonly>
            </div>
        `;
    }

    create2FABlock(rowIndex, index, header, value) {
        const displayValue = value.trim() === "" ? "Chưa có dữ liệu!" : value;
        return `
          <div id="block-${rowIndex}">
            <h4>${index} : ${header}</h4>
            <input class="textURL" value="${displayValue}" id="accountData-${rowIndex}-${index}" readonly>
            <div class="row">
              <input class="textURL" id="inputdata-${rowIndex}" type="text" placeholder="Nhập mã 2FA">
              <button class="btn fas fa-save btn-save" id="saveBtn-${rowIndex}" disabled></button>
            </div>
            <span id="status-saveBtn-${rowIndex}" class="save-status"></span>
            <a class="textURL" href="https://2fa.live/" target="_blank" rel="noopener noreferrer">Lấy Code</a>
          </div>
        `;
    }

    createCopyableBlock(rowIndex, index, header, value) {
        if (value.trim() === "") {
          return `
            <div id="block-${rowIndex}">
              <h4>${index} : ${header}</h4>
              <input class="textURL" value="Chưa có dữ liệu!" id="accountData-${rowIndex}-${index}" readonly>
            </div>
          `;
        }

        return `
          <div id="block-${rowIndex}">
            <h4>${index} : ${header}</h4>
            <div class="row copy-inline">
              <input class="textURL" value="${value}" id="accountData-${rowIndex}-${index}" readonly>
              <button class="btn btn-copy fas fa-copy" data-copy-id="accountData-${rowIndex}-${index}" data-copy-value="${value}" type="button"></button>
              <span id="feedback-accountData-${rowIndex}-${index}" class="copy-feedback">Đã copy!</span>
            </div>
          </div>
        `;
    }

    setupRowEventListeners(rowIndex) {
        const input2fa = document.getElementById(`inputdata-${rowIndex}`);
        const saveBtn = document.getElementById(`saveBtn-${rowIndex}`);
        
        if (input2fa && saveBtn) {
            input2fa.addEventListener("input", () => {
                saveBtn.disabled = input2fa.value.trim().length === 0;
            });
        }
    }

    async handleContainerClick(event) {
        const target = event.target;
        
        // Handle copy button
        if (target.closest(".btn-copy")) {
            await this.handleCopyClick(target.closest(".btn-copy"));
        }
        
        // Handle save 2FA button
        else if (target.closest(".btn-save")) {
            await this.handleSaveClick(target.closest(".btn-save"));
        }
        
        // Handle done button
        else if (target.closest("button[id^='doneButton-']")) {
            await this.handleDoneClick(target.closest("button[id^='doneButton-']"));
        }
        
        // Handle navigation buttons
        else if (target.id === "prevBtn") {
            this.navigateToPrevious();
        }
        else if (target.id === "nextBtn") {
            this.navigateToNext();
        }
    }

    async handleCopyClick(button) {
        const value = button.getAttribute("data-copy-value") || "";
        const copyId = button.getAttribute("data-copy-id");
        
        try {
            await navigator.clipboard.writeText(value);
            this.showCopyFeedback(button, copyId);
        } catch (error) {
            console.error("Lỗi sao chép:", error);
            this.showAlert("Không thể sao chép dữ liệu.");
        }
    }

    showCopyFeedback(button, copyId) {
        const feedback = document.getElementById(`feedback-${copyId}`);
        if (!feedback) return;
        
        button.style.display = "none";
        feedback.classList.add("visible");
        
        setTimeout(() => {
            feedback.classList.remove("visible");
            button.style.display = "inline-block";
        }, 3000);
    }

    async handleSaveClick(button) {
        const rowIndex = parseInt(button.id.split("-")[1]);
        const input = document.getElementById(`inputdata-${rowIndex}`);
        const statusSpan = document.getElementById(`status-saveBtn-${rowIndex}`);
        
        if (!input || !statusSpan) return;
        
        const code2FA = input.value.trim();
        if (!code2FA) return;

        try {
            this.setSaveButtonLoading(button, statusSpan, true);
            
            await this.saveToSheet(rowIndex + 2, code2FA);
            
            this.setSaveButtonSuccess(button, statusSpan);
            input.value = "";
            
        } catch (error) {
            this.setSaveButtonError(button, statusSpan);
        }
    }

    setSaveButtonLoading(button, statusSpan, isLoading) {
        button.disabled = isLoading;
        button.style.display = isLoading ? "none" : "inline-block";
        statusSpan.style.display = isLoading ? "inline" : "none";
        statusSpan.textContent = isLoading ? "Đang gửi..." : "";
    }

    setSaveButtonSuccess(button, statusSpan) {
        statusSpan.textContent = "Đã Lưu!";
        button.style.display = "none";
    }

    setSaveButtonError(button, statusSpan) {
        statusSpan.style.display = "none";
        button.disabled = false;
        button.style.display = "inline-block";
    }

    async handleDoneClick(button) {
        const rowIndex = parseInt(button.id.split("-")[1]);
        const row = this.sheetData[rowIndex];
        const col4Value = row[3];
        
        if (col4Value && col4Value.trim() !== "") {
            this.setDoneButtonComplete(button);
            setTimeout(() => this.loadSheetData(this.selectedSheet), 1000);
            return;
        }

        try {
            button.disabled = true;
            button.textContent = "Đang gửi...";
            
            await this.sendDoneToSheet(this.selectedSheet, rowIndex + 2);
            
            this.setDoneButtonComplete(button);
            
            if (confirm("Đã đánh dấu 'Đã làm' thành công!\nBạn có muốn tải lại dữ liệu sheet này không?")) {
                await this.loadSheetData(this.selectedSheet);
            }
            
        } catch (error) {
            button.disabled = false;
            console.error("Error marking as done:", error);
        }
    }

    setDoneButtonComplete(button) {
        button.textContent = "DONE! LẤY ACCOUNT KHÁC ĐI!";
        button.style.backgroundColor = "yellow";
        button.style.color = "red";
    }

    navigateToPrevious() {
        if (this.currentRowIndex > 0) {
            this.displayData(this.currentRowIndex - 1);
        }
    }

    navigateToNext() {
        if (this.currentRowIndex < this.sheetData.length - 1) {
            this.displayData(this.currentRowIndex + 1);
        }
    }

    async saveToSheet(rowIndex, code2FA) {
        const params = new URLSearchParams({
            sheet: this.selectedSheet,
            row: rowIndex,
            value: code2FA,
            type: "DONE"
        });

        const response = await this.fetchWithErrorHandling(baseUrl, {
            method: "POST",
            body: params
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || "Lỗi khi lưu dữ liệu");
        }
        
        return data;
    }

    async sendDoneToSheet(sheetName, rowIndex) {
        const params = new URLSearchParams({
            sheet: sheetName,
            row: rowIndex,
            type: "DONE"
        });
        
        const response = await this.fetchWithErrorHandling(baseUrl, {
            method: "POST",
            body: params
        });
        
        return response.text();
    }

    async fetchWithErrorHandling(url, options = {}) {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    }

    showLoadingStatus(message) {
        if (this.elements.reloadSheet) {
            this.elements.reloadSheet.innerHTML = `<span class="loading-spinner"></span> ${message}`;
        }
    }

    showSuccessStatus(message) {
        if (this.elements.reloadSheet) {
            this.elements.reloadSheet.innerHTML = `<span style="color:green">${message}</span>`;
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `<span style="color:red">${message}</span>`;
        }
    }

    clearDataContainer() {
        if (this.elements.dataContainer) {
            this.elements.dataContainer.innerHTML = "";
        }
    }

    showAlert(message) {
        alert(message);
    }
}

// Initialize the sheet manager
let sheetManager;

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        sheetManager = new SheetManager();
    });
} else {
    sheetManager = new SheetManager();
}
