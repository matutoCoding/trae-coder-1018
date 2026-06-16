const Storage = {
    get(key,
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    remove(key) {
        localStorage.removeItem(key);
    }
};

const AppState = {
    materials: Storage.get('materials') || [],
    forming: Storage.get('forming') || [],
    decorating: Storage.get('decorating') || [],
    firing: Storage.get('firing') || [],
    inspection: Storage.get('inspection') || [],
    orders: Storage.get('orders') || [],
    sales: Storage.get('sales') || [],
    currentPage: 'material',
    currentBatch: 'JCG-2026-001'
};

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(date = new Date()) {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateTime(date = new Date()) {
    const d = new Date(date);
    return `${formatDate(d)} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function generateId(prefix) {
    const year = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return `${prefix}-${year}-${num}`;
}

function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const pageId = tab.dataset.page;
            navigateTo(pageId);
        });
    });
}

function navigateTo(pageId) {
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');
    
    tabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.page === pageId);
    });
    
    pages.forEach(page => {
        page.classList.toggle('active', page.id === pageId);
    });
    
    AppState.currentPage = pageId;
    
    if (pageId === 'forming') {
        updateFormingMaterialSelect();
    } else if (pageId === 'decorating') {
        updateLinkFormingSelect();
    } else if (pageId === 'firing') {
        updateLinkDecoratingCheckboxes();
        drawFiringChart();
    } else if (pageId === 'inspection') {
        updateLinkFiringSelect();
        updateInspectionStats();
    } else if (pageId === 'sales') {
        updateSalesProductSelect();
        updateSalesStats();
    }
}

function initDate() {
    document.getElementById('currentDate').textContent = formatDate();
    document.getElementById('currentBatch').textContent = AppState.currentBatch;
}

function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
}

function initModal() {
    document.getElementById('modalClose').addEventListener('click', closeModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') closeModal();
    });
}

function initMaterialForm() {
    const form = document.getElementById('materialForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const material = {
            id: document.getElementById('materialId').value || generateId('NL'),
            name: document.getElementById('materialName').value,
            origin: document.getElementById('materialOrigin').value,
            weight: parseFloat(document.getElementById('materialWeight').value),
            moisture: parseFloat(document.getElementById('moisture').value || 0,
            agingDays: parseInt(document.getElementById('agingDays').value || 0,
            remark: document.getElementById('materialRemark').value,
            status: '可用',
            createTime: new Date().toISOString()
        };
        
        AppState.materials.unshift(material);
        Storage.set('materials', AppState.materials);
        
        renderMaterialList();
        updateFormingMaterialSelect();
        
        form.reset();
        showToast('泥料登记成功！');
    });
    
    renderMaterialList();
}

function renderMaterialList() {
    const tbody = document.getElementById('materialList');
    tbody.innerHTML = '';
    
    if (AppState.materials.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无泥料数据，请先登记</td></tr>');
        return;
    }
    
    AppState.materials.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusClass = item.weight > 0 ? 'status-success' : 'status-warning';
        const statusText = item.weight > 0 ? '可用' : '已用完';
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.name}</td>
            <td>${item.origin}</td>
            <td>${item.weight.toFixed(1)}</td>
            <td>${item.moisture}%</td>
            <td>${item.agingDays}天</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewMaterialDetail(${index})">详情</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteMaterial(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewMaterialDetail(index) {
    const item = AppState.materials[index];
    showModal('泥料详情', `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">泥料编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">泥料名称</span><span class="detail-value">${item.name}</span></div>
            <div class="detail-item"><span class="detail-label">产地来源</span><span class="detail-value">${item.origin}</span></div>
            <div class="detail-item"><span class="detail-label">库存数量</span><span class="detail-value">${item.weight.toFixed(1)} kg</span></div>
            <div class="detail-item"><span class="detail-label">含水率</span><span class="detail-value">${item.moisture}%</span></div>
            <div class="detail-item"><span class="detail-label">陈腐天数</span><span class="detail-value">${item.agingDays} 天</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">${item.status}</span></div>
            <div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">${formatDateTime(item.createTime)}</span></div>
        </div>
        ${item.remark ? `<p style="margin-top: 16px;"><strong>备注：</strong>${item.remark}</p>` : ''}
    `);
}

function deleteMaterial(index) {
    if (confirm('确定要删除这条泥料记录吗？')) {
        AppState.materials.splice(index, 1);
        Storage.set('materials', AppState.materials);
        renderMaterialList();
        showToast('删除成功');
    }
}

function updateFormingMaterialSelect() {
    const select = document.getElementById('formingMaterial');
    select.innerHTML = '<option value="">请选择泥料</option>';
    
    AppState.materials.forEach(item => {
        if (item.weight > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} (${item.id}) - 库存: ${item.weight}kg`;
            select.appendChild(option);
        }
    });
}

function initFormingForm() {
    const form = document.getElementById('formingForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const materialId = document.getElementById('formingMaterial').value;
        const material = AppState.materials.find(m => m.id === materialId);
        
        const forming = {
            id: document.getElementById('formingId').value || generateId('CX'),
            vesselType: document.getElementById('vesselType').value,
            materialId: materialId,
            materialName: material ? material.name : '',
            method: document.getElementById('formingMethod').value,
            artisan: document.getElementById('artisan').value,
            quantity: parseInt(document.getElementById('formingQuantity').value,
            height: parseFloat(document.getElementById('height').value || 0,
            diameter: parseFloat(document.getElementById('diameter').value || 0,
            weight: parseFloat(document.getElementById('formingWeight').value || 0,
            dryingMethod: document.getElementById('dryingMethod').value,
            dryingDays: parseInt(document.getElementById('dryingDays').value || 0,
            status: '待装饰',
            createTime: new Date().toISOString()
        };
        
        AppState.forming.unshift(forming);
        Storage.set('forming', AppState.forming);
        
        renderFormingList();
        updateLinkFormingSelect();
        
        form.reset();
        showToast('成型记录成功！');
    });
    
    renderFormingList();
}

function renderFormingList() {
    const tbody = document.getElementById('formingList');
    tbody.innerHTML = '';
    
    if (AppState.forming.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无成型记录，请先登记</td></tr>');
        return;
    }
    
    AppState.forming.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusMap = {
            '待装饰': 'status-info',
            '装饰中': 'status-warning',
            '待烧制': 'status-info',
            '已完成': 'status-success'
        };
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.vesselType}</td>
            <td>${item.method}</td>
            <td>${item.artisan}</td>
            <td>${item.quantity}</td>
            <td>${item.height}×${item.diameter}cm</td>
            <td>${item.dryingMethod}</td>
            <td><span class="status-badge ${statusMap[item.status] || 'status-info'}">${item.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewFormingDetail(${index})">详情</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteForming(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewFormingDetail(index) {
    const item = AppState.forming[index];
    showModal('成型详情', `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">成型编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">器型名称</span><span class="detail-value">${item.vesselType}</span></div>
            <div class="detail-item"><span class="detail-label">使用泥料</span><span class="detail-value">${item.materialName}</span></div>
            <div class="detail-item"><span class="detail-label">成型工艺</span><span class="detail-value">${item.method}</span></div>
            <div class="detail-item"><span class="detail-label">匠人</span><span class="detail-value">${item.artisan}</span></div>
            <div class="detail-item"><span class="detail-label">数量</span><span class="detail-value">${item.quantity} 件</span></div>
            <div class="detail-item"><span class="detail-label">尺寸</span><span class="detail-value">${item.height}×${item.diameter} cm</span></div>
            <div class="detail-item"><span class="detail-label">单件重量</span><span class="detail-value">${item.weight} g</span></div>
            <div class="detail-item"><span class="detail-label">干燥方式</span><span class="detail-value">${item.dryingMethod}</span></div>
            <div class="detail-item"><span class="detail-label">干燥天数</span><span class="detail-value">${item.dryingDays} 天</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">${item.status}</span></div>
            <div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">${formatDateTime(item.createTime)}</span></div>
        </div>
    `);
}

function deleteForming(index) {
    if (confirm('确定要删除这条成型记录吗？')) {
        AppState.forming.splice(index, 1);
        Storage.set('forming', AppState.forming);
        renderFormingList();
        updateLinkFormingSelect();
        showToast('删除成功');
    }
}

function updateLinkFormingSelect() {
    const select = document.getElementById('linkForming');
    select.innerHTML = '<option value="">请选择成型坯体</option>';
    
    AppState.forming.forEach(item => {
        if (item.status === '待装饰') {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.vesselType} (${item.id}) - ${item.artisan}`;
            select.appendChild(option);
        }
    });
}

function initDecoratingForm() {
    const form = document.getElementById('decoratingForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const formingId = document.getElementById('linkForming').value;
        const forming = AppState.forming.find(f => f.id === formingId);
        
        const decorating = {
            id: document.getElementById('decoratingId').value || generateId('ZS'),
            formingId: formingId,
            vesselType: forming ? forming.vesselType : '',
            method: document.getElementById('decorateMethod').value,
            pattern: document.getElementById('pattern').value,
            painter: document.getElementById('painter').value,
            glazeType: document.getElementById('glazeType').value,
            glazeMethod: document.getElementById('glazeMethod').value,
            glazeThickness: parseFloat(document.getElementById('glazeThickness').value || 0,
            markType: document.getElementById('markType').value,
            markContent: document.getElementById('markContent').value,
            markPosition: document.getElementById('markPosition').value,
            status: '待烧制',
            createTime: new Date().toISOString()
        };
        
        AppState.decorating.unshift(decorating);
        Storage.set('decorating', AppState.decorating);
        
        if (forming) {
            forming.status = '装饰完成';
            Storage.set('forming', AppState.forming);
            renderFormingList();
        }
        
        renderDecoratingList();
        updateLinkDecoratingCheckboxes();
        
        form.reset();
        showToast('装饰记录成功！');
    });
    
    renderDecoratingList();
}

function renderDecoratingList() {
    const tbody = document.getElementById('decoratingList');
    tbody.innerHTML = '';
    
    if (AppState.decorating.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无装饰记录，请先登记</td></tr>');
        return;
    }
    
    AppState.decorating.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusMap = {
            '待烧制': 'status-warning',
            '烧制中': 'status-info',
            '已完成': 'status-success'
        };
        const markText = item.markType !== '无款' ? `${item.markType}: ${item.markContent}` : '无款';
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.vesselType}</td>
            <td>${item.method}</td>
            <td>${item.pattern || '无'}</td>
            <td>${item.painter}</td>
            <td>${item.glazeType}</td>
            <td>${markText}</td>
            <td><span class="status-badge ${statusMap[item.status] || 'status-info'}">${item.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewDecoratingDetail(${index})">详情</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDecorating(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewDecoratingDetail(index) {
    const item = AppState.decorating[index];
    const markText = item.markType !== '无款' ? `${item.markType}: ${item.markContent} (${item.markPosition})` : '无款';
    
    showModal('装饰详情', `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">装饰编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">器型</span><span class="detail-value">${item.vesselType}</span></div>
            <div class="detail-item"><span class="detail-label">装饰工艺</span><span class="detail-value">${item.method}</span></div>
            <div class="detail-item"><span class="detail-label">纹饰图案</span><span class="detail-value">${item.pattern || '无'}</span></div>
            <div class="detail-item"><span class="detail-label">画师</span><span class="detail-value">${item.painter}</span></div>
            <div class="detail-item"><span class="detail-label">釉料种类</span><span class="detail-value">${item.glazeType}</span></div>
            <div class="detail-item"><span class="detail-label">施釉方法</span><span class="detail-value">${item.glazeMethod}</span></div>
            <div class="detail-item"><span class="detail-label">釉层厚度</span><span class="detail-value">${item.glazeThickness} mm</span></div>
            <div class="detail-item"><span class="detail-label">款识</span><span class="detail-value">${markText}</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">${item.status}</span></div>
            <div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">${formatDateTime(item.createTime)}</span></div>
        </div>
    `);
}

function deleteDecorating(index) {
    if (confirm('确定要删除这条装饰记录吗？')) {
        AppState.decorating.splice(index, 1);
        Storage.set('decorating', AppState.decorating);
        renderDecoratingList();
        updateLinkDecoratingCheckboxes();
        showToast('删除成功');
    }
}

function updateLinkDecoratingCheckboxes() {
    const container = document.getElementById('linkDecorating');
    container.innerHTML = '';
    
    const available = AppState.decorating.filter(item => item.status === '待烧制');
    
    if (available.length === 0) {
        container.innerHTML = '<p style="color: var(--ink-light); text-align: center; padding: 20px;">暂无待烧制的坯体</p>';
        return;
    }
    
    available.forEach(item => {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML = `
            <input type="checkbox" name="decoratingItems" value="${item.id}">
            <span>${item.vesselType} (${item.id})</span>
        `;
        container.appendChild(label);
    });
}

function initFiringForm() {
    const form = document.getElementById('firingForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const selectedItems = Array.from(document.querySelectorAll('input[name="decoratingItems"]:checked')).map(cb => cb.value);
        
        if (selectedItems.length === 0) {
            showToast('请至少选择一个待烧制的坯体', 'warning');
            return;
        }
        
        const firing = {
            id: document.getElementById('firingId').value || generateId('YS'),
            kilnType: document.getElementById('kilnType').value,
            kilnNo: document.getElementById('kilnNo').value,
            saggarType: document.getElementById('saggarType').value,
            kilnPosition: document.getElementById('kilnPosition').value,
            loadQuantity: parseInt(document.getElementById('loadQuantity').value),
            decoratingIds: selectedItems,
            atmosphere: document.getElementById('atmosphere').value,
            maxTemp: parseInt(document.getElementById('maxTemp').value),
            firingHours: parseFloat(document.getElementById('firingHours').value || 0,
            fireMaster: document.getElementById('fireMaster').value,
            status: '烧制中',
            startTime: new Date().toISOString(),
            endTime: null
        };
        
        AppState.firing.unshift(firing);
        Storage.set('firing', AppState.firing);
        
        selectedItems.forEach(id => {
            const decorating = AppState.decorating.find(d => d.id === id);
            if (decorating) {
                decorating.status = '烧制中';
            }
        });
        Storage.set('decorating', AppState.decorating);
        
        renderDecoratingList();
        renderFiringList();
        updateLinkFiringSelect();
        
        form.reset();
        updateLinkDecoratingCheckboxes();
        showToast('窑次登记成功，开始烧窑！');
    });
    
    renderFiringList();
}

function renderFiringList() {
    const tbody = document.getElementById('firingList');
    tbody.innerHTML = '';
    
    if (AppState.firing.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无窑次记录，请先登记</td></tr>');
        return;
    }
    
    AppState.firing.forEach((item, index) => {
        const tr = document.createElement('tr');
        const statusMap = {
            '烧制中': 'status-warning',
            '烧制完成': 'status-success',
            '已出窑': 'status-info'
        };
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.kilnType}</td>
            <td>${item.loadQuantity}</td>
            <td>${item.maxTemp}℃</td>
            <td>${item.firingHours}h</td>
            <td>${item.fireMaster}</td>
            <td><span class="status-badge ${statusMap[item.status] || 'status-info'}">${item.status}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewFiringDetail(${index})">详情</button>
                    ${item.status === '烧制中' ? `<button class="btn btn-sm btn-success" onclick="completeFiring(${index})">出窑</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteFiring(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function completeFiring(index) {
    if (confirm('确定窑烧完成，要标记为出窑吗？')) {
        const item = AppState.firing[index];
        item.status = '已出窑';
        item.endTime = new Date().toISOString();
        
        item.decoratingIds.forEach(id => {
            const decorating = AppState.decorating.find(d => d.id === id);
            if (decorating) {
                decorating.status = '烧制完成';
            }
        });
        
        Storage.set('firing', AppState.firing);
        Storage.set('decorating', AppState.decorating);
        
        renderFiringList();
        renderDecoratingList();
        updateLinkFiringSelect();
        showToast('窑烧完成，已出窑！');
    }
}

function viewFiringDetail(index) {
    const item = AppState.firing[index];
    const vesselList = item.decoratingIds.map(id => {
        const d = AppState.decorating.find(x => x.id === id);
        return d ? d.vesselType : id;
    }).join(', ');
    
    showModal('窑次详情', `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">窑次编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">窑炉类型</span><span class="detail-value">${item.kilnType}</span></div>
            <div class="detail-item"><span class="detail-label">窑炉编号</span><span class="detail-value">${item.kilnNo || '-'}</span></div>
            <div class="detail-item"><span class="detail-label">匣钵类型</span><span class="detail-value">${item.saggarType}</span></div>
            <div class="detail-item"><span class="detail-label">装窑位置</span><span class="detail-value">${item.kilnPosition}</span></div>
            <div class="detail-item"><span class="detail-label">装坯数量</span><span class="detail-value">${item.loadQuantity} 件</span></div>
            <div class="detail-item"><span class="detail-label">烧成气氛</span><span class="detail-value">${item.atmosphere}</span></div>
            <div class="detail-item"><span class="detail-label">最高温度</span><span class="detail-value">${item.maxTemp}℃</span></div>
            <div class="detail-item"><span class="detail-label">烧造时间</span><span class="detail-value">${item.firingHours} 小时</span></div>
            <div class="detail-item"><span class="detail-label">把桩师傅</span><span class="detail-value">${item.fireMaster}</span></div>
            <div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">${item.status}</span></div>
            <div class="detail-item"><span class="detail-label">点火时间</span><span class="detail-value">${formatDateTime(item.startTime)}</span></div>
        </div>
        <p style="margin-top: 16px;"><strong>烧制器物：</strong>${vesselList}</p>
        ${item.endTime ? `<p><strong>出窑时间：</strong>${formatDateTime(item.endTime)}</p>` : ''}
    `);
}

function deleteFiring(index) {
    if (confirm('确定要删除这条窑次记录吗？')) {
        AppState.firing.splice(index, 1);
        Storage.set('firing', AppState.firing);
        renderFiringList();
        updateLinkFiringSelect();
        showToast('删除成功');
    }
}

function drawFiringChart() {
    const canvas = document.getElementById('firingChart');
    const ctx = canvas.getContext('2d');
    
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    
    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    ctx.clearRect(0, 0, width, height);
    
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(width - padding.right, y);
        ctx.stroke();
        
        ctx.fillStyle = '#4A5568';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        const temp = 1400 - (200 * i);
        ctx.fillText(temp + '℃', padding.left - 5, y + 3);
    }
    
    const timeLabels = ['0h', '10h', '20h', '30h', '40h', '50h', '60h'];
    timeLabels.forEach((label, i) => {
        const x = padding.left + (chartWidth / 6) * i;
        ctx.fillStyle = '#4A5568';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(label, x, height - padding.bottom + 20);
    });
    
    const woodKilnData = [
        { x: 0, y: 25 },
        { x: 5, y: 300 },
        { x: 10, y: 600 },
        { x: 15, y: 800 },
        { x: 20, y: 1000 },
        { x: 30, y: 1200 },
        { x: 40, y: 1320 },
        { x: 48, y: 1320 },
        { x: 52, y: 1000 },
        { x: 60, y: 200 }
    ];
    
    const gasKilnData = [
        { x: 0, y: 25 },
        { x: 2, y: 300 },
        { x: 5, y: 600 },
        { x: 8, y: 900 },
        { x: 12, y: 1200 },
        { x: 15, y: 1300 },
        { x: 18, y: 1320 },
        { x: 20, y: 1320 },
        { x: 24, y: 800 },
        { x: 30, y: 200 }
    ];
    
    function drawCurve(data, color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        data.forEach((point, index) => {
            const x = padding.left + (point.x / 60) * chartWidth;
            const y = padding.top + (1400 - point.y) / 1400 * chartHeight;
            
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        
        ctx.stroke();
        
        data.forEach(point => {
            const x = padding.left + (point.x / 60) * chartWidth;
            const y = padding.top + (1400 - point.y) / 1400 * chartHeight;
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }
    
    drawCurve(woodKilnData, '#8B0000');
    drawCurve(gasKilnData, '#4682B4');
    
    ctx.fillStyle = '#2D3748';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('烧成时间 (小时)', width / 2, height - 10);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('温度 (℃)', 0, 0);
    ctx.restore();
}

function updateLinkFiringSelect() {
    const select = document.getElementById('linkFiring');
    select.innerHTML = '<option value="">请选择窑次</option>';
    
    AppState.firing.forEach(item => {
        if (item.status === '已出窑') {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.id} - ${item.kilnType} - ${item.loadQuantity}件`;
            select.appendChild(option);
        }
    });
    
    select.addEventListener('change', function() {
        const firingId = this.value;
        const firing = AppState.firing.find(f => f.id === firingId);
        if (firing && firing.decoratingIds.length > 0) {
            const decorating = AppState.decorating.find(d => d.id === firing.decoratingIds[0]);
            if (decorating) {
                document.getElementById('inspectVessel').value = decorating.vesselType;
            }
        }
    });
}

function initInspectionForm() {
    const form = document.getElementById('inspectionForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const defects = Array.from(document.querySelectorAll('input[name="defects"]:checked')).map(cb => cb.value);
        
        const inspection = {
            id: document.getElementById('inspectionId').value || generateId('JY'),
            firingId: document.getElementById('linkFiring').value,
            productId: document.getElementById('productId').value || generateId('CP'),
            vesselType: document.getElementById('inspectVessel').value,
            defects: defects,
            deformationLevel: document.getElementById('deformationLevel').value,
            actualHeight: parseFloat(document.getElementById('actualHeight').value || 0,
            actualDiameter: parseFloat(document.getElementById('actualDiameter').value || 0,
            actualWeight: parseFloat(document.getElementById('actualWeight').value || 0,
            grade: document.getElementById('productGrade').value,
            remark: document.getElementById('inspectRemark').value,
            inspector: document.getElementById('inspector').value,
            status: '已检验',
            createTime: new Date().toISOString()
        };
        
        AppState.inspection.unshift(inspection);
        Storage.set('inspection', AppState.inspection);
        
        renderInspectionList();
        updateInspectionStats();
        updateSalesProductSelect();
        updateSalesStats();
        
        form.reset();
        showToast('检验记录成功！');
    });
    
    renderInspectionList();
}

function renderInspectionList() {
    const tbody = document.getElementById('inspectionList');
    tbody.innerHTML = '';
    
    if (AppState.inspection.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无检验记录，请先登记</td></tr>');
        return;
    }
    
    AppState.inspection.forEach((item, index) => {
        const tr = document.createElement('tr');
        const gradeClass = {
            '珍品': 'grade-rare',
            '精品': 'grade-fine',
            '正品': 'grade-normal',
            '次品': 'grade-defect',
            '废品': 'grade-waste'
        };
        
        const defectText = item.defects.length > 0 ? item.defects.join('、') : '无缺陷';
        
        tr.innerHTML = `
            <td>${item.productId}</td>
            <td>${item.vesselType}</td>
            <td>${defectText}</td>
            <td><span class="grade-badge ${gradeClass[item.grade] || ''}">${item.grade}级</span></td>
            <td>${item.inspector}</td>
            <td>${formatDate(item.createTime)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewInspectionDetail(${index})">详情</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteInspection(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewInspectionDetail(index) {
    const item = AppState.inspection[index];
    const defectText = item.defects.length > 0 ? item.defects.join('、') : '无缺陷';
    const gradeClass = {
        '珍品': 'grade-rare',
        '精品': 'grade-fine',
        '正品': 'grade-normal',
        '次品': 'grade-defect',
        '废品': 'grade-waste'
    };
    
    showModal('检验详情', `
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">检验编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">产品编号</span><span class="detail-value">${item.productId}</span></div>
            <div class="detail-item"><span class="detail-label">器型</span><span class="detail-value">${item.vesselType}</span></div>
            <div class="detail-item"><span class="detail-label">缺陷</span><span class="detail-value">${defectText}</span></div>
            <div class="detail-item"><span class="detail-label">变形程度</span><span class="detail-value">${item.deformationLevel}</span></div>
            <div class="detail-item"><span class="detail-label">实际尺寸</span><span class="detail-value">${item.actualHeight}×${item.actualDiameter} cm</span></div>
            <div class="detail-item"><span class="detail-label">实际重量</span><span class="detail-value">${item.actualWeight} g</span></div>
            <div class="detail-item"><span class="detail-label">成品等级</span><span class="grade-badge ${gradeClass[item.grade] || ''}">${item.grade}级</span></div>
            <div class="detail-item"><span class="detail-label">检验员</span><span class="detail-value">${item.inspector}</span></div>
            <div class="detail-item"><span class="detail-label">检验时间</span><span class="detail-value">${formatDateTime(item.createTime)}</span></div>
        </div>
        ${item.remark ? `<p style="margin-top: 16px;"><strong>评估说明：</strong>${item.remark}</p>` : ''}
    `);
}

function deleteInspection(index) {
    if (confirm('确定要删除这条检验记录吗？')) {
        AppState.inspection.splice(index, 1);
        Storage.set('inspection', AppState.inspection);
        renderInspectionList();
        updateInspectionStats();
        updateSalesProductSelect();
        updateSalesStats();
        showToast('删除成功');
    }
}

function updateInspectionStats() {
    const stats = {
        rare: AppState.inspection.filter(i => i.grade === '珍品').length,
        fine: AppState.inspection.filter(i => i.grade === '精品').length,
        normal: AppState.inspection.filter(i => i.grade === '正品').length,
        defect: AppState.inspection.filter(i => i.grade === '次品').length,
        waste: AppState.inspection.filter(i => i.grade === '废品').length
    };
    
    const total = AppState.inspection.length;
    const pass = total - stats.waste;
    const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : 0;
    
    document.getElementById('statRare').textContent = stats.rare;
    document.getElementById('statFine').textContent = stats.fine;
    document.getElementById('statNormal').textContent = stats.normal;
    document.getElementById('statDefect').textContent = stats.defect;
    document.getElementById('statWaste').textContent = stats.waste;
    document.getElementById('statRate').textContent = rate;
    
    const defectCounts = {
        deformation: 0,
        crack: 0,
        glaze: 0,
        bubble: 0
    };
    
    AppState.inspection.forEach(item => {
        if (item.defects.forEach(d => {
            if (d === '变形') defectCounts.deformation++;
            if (d === '开裂') defectCounts.crack++;
            if (d === '缩釉') defectCounts.glaze++;
            if (d === '气泡') defectCounts.bubble++;
        }));
    });
    
    const maxDefect = Math.max(...Object.values(defectCounts), 1);
    
    document.getElementById('countDeformation').textContent = defectCounts.deformation;
    document.getElementById('barDeformation').style.width = `${(defectCounts.deformation / maxDefect * 100}%`;
    
    document.getElementById('countCrack').textContent = defectCounts.crack;
    document.getElementById('barCrack').style.width = `${(defectCounts.crack / maxDefect * 100}%`;
    
    document.getElementById('countGlaze').textContent = defectCounts.glaze;
    document.getElementById('barGlaze').style.width = `${(defectCounts.glaze / maxDefect * 100}%`;
    
    document.getElementById('countBubble').textContent = defectCounts.bubble;
    document.getElementById('barBubble').style.width = `${(defectCounts.bubble / maxDefect * 100}%`;
}

function initOrderForm() {
    const form = document.getElementById('orderForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const order = {
            id: document.getElementById('orderId').value || generateId('DD'),
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            orderType: document.getElementById('orderType').value,
            customVessel: document.getElementById('customVessel').value,
            quantity: parseInt(document.getElementById('orderQuantity').value,
            customHeight: parseFloat(document.getElementById('customHeight').value || 0,
            customDiameter: parseFloat(document.getElementById('customDiameter').value || 0,
            customPattern: document.getElementById('customPattern').value,
            customGlaze: document.getElementById('customGlaze').value,
            customMarkType: document.getElementById('customMarkType').value,
            customMark: document.getElementById('customMark').value,
            customFiring: document.getElementById('customFiring').value,
            minPrice: parseFloat(document.getElementById('minPrice').value || 0,
            maxPrice: parseFloat(document.getElementById('maxPrice').value || 0,
            deliveryDate: document.getElementById('deliveryDate').value,
            remark: document.getElementById('orderRemark').value,
            deposit: parseFloat(document.getElementById('deposit').value || 0,
            status: '待确认',
            progress: 1,
            createTime: new Date().toISOString()
        };
        
        AppState.orders.unshift(order);
        Storage.set('orders', AppState.orders);
        
        renderOrderList();
        
        form.reset();
        showToast('订单创建成功！');
    });
    
    renderOrderList();
}

function renderOrderList() {
    const tbody = document.getElementById('orderList');
    tbody.innerHTML = '';
    
    if (AppState.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无订单，请先创建</td></tr>');
        return;
    }
    
    const statusMap = {
        '待确认': 'status-warning',
        '已确认': 'status-info',
        '制作中': 'status-info',
        '已完成': 'status-success',
        '已交付': 'status-success'
    };
    
    const progressSteps = ['订单确认', '泥料准备', '成型制作', '装饰施釉', '入窑烧制', '成品检验', '交付客户'];
    
    AppState.orders.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.customerName}</td>
            <td>${item.customVessel} - ${item.orderType}</td>
            <td>${item.quantity}</td>
            <td>${item.deliveryDate}</td>
            <td><span class="status-badge ${statusMap[item.status] || 'status-info'}">${item.status}</span></td>
            <td>
                <div style="width: 100px; background: var(--border); border-radius: 4px; height: 8px;">
                    <div style="width: ${(item.progress / 6 * 100}%; height: 100%; background: linear-gradient(90deg, var(--primary-blue), var(--celadon)); border-radius: 4px;"></div>
                </div>
                <small style="color: var(--ink-light);">${progressSteps[item.progress] || '已完成'}</small>
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="viewOrderDetail(${index})">详情</button>
                    ${item.progress < 6 ? `<button class="btn btn-sm btn-success" onclick="advanceOrder(${index})">推进</button>` : ''}
                    <button class="btn btn-sm btn-danger" onclick="deleteOrder(${index})">删除</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function viewOrderDetail(index) {
    const item = AppState.orders[index];
    const progressSteps = ['订单确认', '泥料准备', '成型制作', '装饰施釉', '入窑烧制', '成品检验', '交付客户'];
    
    const trackerHTML = progressSteps.map((step, i) => {
        let className = 'progress-step';
        if (i < item.progress) className += ' completed';
        if (i === item.progress) className += ' active';
        const icons = ['订', '土', '轮', '青', '窑', '检', '送'];
        
        return `
            <div class="${className}">
                <div class="step-icon">${icons[i]}</div>
                <div class="step-label">${step}</div>
            </div>
            ${i < progressSteps.length - 1 ? `<div class="progress-line ${i < item.progress ? 'completed' : ''}"></div>` : ''}
        `;
    }).join('');
    
    const markText = item.customMarkType !== '无' ? `${item.customMarkType}: ${item.customMark}` : '无特殊要求';
    
    showModal('订单详情', `
        <div class="progress-tracker" style="padding: 10px 0;">${trackerHTML}</div>
        <div class="detail-grid">
            <div class="detail-item"><span class="detail-label">订单编号</span><span class="detail-value">${item.id}</span></div>
            <div class="detail-item"><span class="detail-label">客户姓名</span><span class="detail-value">${item.customerName}</span></div>
            <div class="detail-item"><span class="detail-label">联系电话</span><span class="detail-value">${item.customerPhone}</span></div>
            <div class="detail-item"><span class="detail-label">定制类型</span><span class="detail-value">${item.orderType}</span></div>
            <div class="detail-item"><span class="detail-label">定制器型</span><span class="detail-value">${item.customVessel}</span></div>
            <div class="detail-item"><span class="detail-label">定制数量</span><span class="detail-value">${item.quantity} 件</span></div>
            <div class="detail-item"><span class="detail-label">尺寸要求</span><span class="detail-value">${item.customHeight}×${item.customDiameter} cm</span></div>
            <div class="detail-item"><span class="detail-label">纹饰要求</span><span class="detail-value">${item.customPattern || '无'}</span></div>
            <div class="detail-item"><span class="detail-label">釉色要求</span><span class="detail-value">${item.customGlaze || '无'}</span></div>
            <div class="detail-item"><span class="detail-label">款识要求</span><span class="detail-value">${markText}</span></div>
            <div class="detail-item"><span class="detail-label">烧制要求</span><span class="detail-value">${item.customFiring}</span></div>
            <div class="detail-item"><span class="detail-label">价格区间</span><span class="detail-value">${item.minPrice}-${item.maxPrice} 元</span></div>
            <div class="detail-item"><span class="detail-label">交付日期</span><span class="detail-value">${item.deliveryDate}</span></div>
            <div class="detail-item"><span class="detail-label">已收定金</span><span class="detail-value">${item.deposit} 元</span></div>
            <div class="detail-item"><span class="detail-label">订单状态</span><span class="detail-value">${item.status}</span></div>
            <div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">${formatDateTime(item.createTime)}</span></div>
        </div>
        ${item.remark ? `<p style="margin-top: 16px;"><strong>特殊要求：</strong>${item.remark}</p>` : ''}
    `);
}

function advanceOrder(index) {
    const item = AppState.orders[index];
    if (item.progress < 6) {
        item.progress++;
        if (item.progress === 6) {
            item.status = '已完成';
        } else if (item.progress > 0) {
            item.status = '制作中';
        }
        Storage.set('orders', AppState.orders);
        renderOrderList();
        showToast('订单进度已推进！');
    }
}

function deleteOrder(index) {
    if (confirm('确定要删除这条订单吗？')) {
        AppState.orders.splice(index, 1);
        Storage.set('orders', AppState.orders);
        renderOrderList();
        showToast('删除成功');
    }
}

function updateSalesProductSelect() {
    const select = document.getElementById('salesProduct');
    select.innerHTML = '<option value="">请选择成品</option>';
    
    AppState.inspection.forEach(item => {
        if (item.grade !== '废品' && !AppState.sales.find(s => s.productId === item.productId)) {
            const option = document.createElement('option');
            option.value = item.productId;
            option.textContent = `${item.productId} - ${item.vesselType} - ${item.grade}级';
            select.appendChild(option);
        }
    });
    
    select.addEventListener('change', function() {
        const productId = this.value;
        const inspection = AppState.inspection.find(i => i.productId === productId);
        const infoDiv = document.getElementById('productInfo');
        
        if (inspection) {
            const gradeClass = {
                '珍品': 'grade-rare',
                '精品': 'grade-fine',
                '正品': 'grade-normal',
                '次品': 'grade-defect'
            };
            
            infoDiv.innerHTML = `
                <div class="product-info-grid">
                    <div class="info-cell"><span class="info-cell-label">产品编号</span><span class="info-cell-value">${inspection.productId}</span></div>
                    <div class="info-cell"><span class="info-cell-label">器型</span><span class="info-cell-value">${inspection.vesselType}</span></div>
                    <div class="info-cell"><span class="info-cell-label">等级</span><span class="info-cell-value"><span class="grade-badge ${gradeClass[inspection.grade] || ''}">${inspection.grade}级</span></span></div>
                    <div class="info-cell"><span class="info-cell-label">尺寸</span><span class="info-cell-value">${inspection.actualHeight}×${inspection.actualDiameter}cm</span></div>
                    <div class="info-cell"><span class="info-cell-label">重量</span><span class="info-cell-value">${inspection.actualWeight}g</span></div>
                    <div class="info-cell"><span class="info-cell-label">缺陷</span><span class="info-cell-value">${inspection.defects.join('、') || '无'}</span></div>
                </div>
            `;
        } else {
            infoDiv.innerHTML = '<p>请选择产品</p>';
        }
    });
}

function initSalesForm() {
    const form = document.getElementById('salesForm');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const productId = document.getElementById('salesProduct').value;
        const inspection = AppState.inspection.find(i => i.productId === productId);
        
        const sales = {
            id: document.getElementById('salesId').value || generateId('XS'),
            productId: productId,
            vesselType: inspection ? inspection.vesselType : '',
            grade: inspection ? inspection.grade : '',
            customerName: document.getElementById('salesCustomer').value,
            customerType: document.getElementById('customerType').value,
            price: parseFloat(document.getElementById('salesPrice').value),
            paymentMethod: document.getElementById('paymentMethod').value,
            salesperson: document.getElementById('salesperson').value,
            shippingMethod: document.getElementById('shippingMethod').value,
            insurance: parseFloat(document.getElementById('insurance').value || 0,
            remark: document.getElementById('salesRemark').value,
            certNo: document.getElementById('certNo').value,
            createTime: new Date().toISOString()
        };
        
        AppState.sales.unshift(sales);
        Storage.set('sales', AppState.sales);
        
        renderSalesList();
        updateSalesStats();
        updateSalesProductSelect();
        
        form.reset();
        document.getElementById('productInfo').innerHTML = '<p>请选择产品</p>';
        showToast('销售登记成功！');
    });
    
    renderSalesList();
    
    document.getElementById('searchTrace').addEventListener('click', function() {
        const code = document.getElementById('traceCode').value.trim();
        if (!code) {
            showToast('请输入产品编号', 'warning');
            return;
        }
        showTraceResult(code);
    });
    
    document.getElementById('traceCode').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            document.getElementById('searchTrace').click();
        }
    });
}

function renderSalesList() {
    const tbody = document.getElementById('salesList');
    tbody.innerHTML = '';
    
    if (AppState.sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--ink-light);">暂无销售记录，请先登记</td></tr>');
        return;
    }
    
    AppState.sales.forEach((item, index) => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
            <td>${item.id}</td>
            <td>${item.productId}<br><small>${item.vesselType}</small></td>
            <td>${item.customerName}</td>
            <td>¥${item.price.toLocaleString()}</td>
            <td>${item.salesperson}</td>
            <td>${formatDate(item.createTime)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn btn-sm btn-primary" onclick="showTrace('${item.productId}')">溯源</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function showTrace(productId) {
    document.getElementById('traceCode').value = productId;
    showTraceResult(productId);
    
    const sales = AppState.sales.find(s => s.productId === productId);
    if (sales) {
        navigateTo('sales');
    }
}

function showTraceResult(productId) {
    const resultDiv = document.getElementById('traceResult');
    const timelineDiv = document.getElementById('timeline');
    
    const inspection = AppState.inspection.find(i => i.productId === productId);
    
    if (!inspection) {
        resultDiv.innerHTML = `
            <div class="trace-empty">
            <div class="trace-icon">瓷</div>
            <p>未找到产品 <strong>${productId}</strong> 的溯源信息</p>
            </div>
        `;
        timelineDiv.innerHTML = '<div class="timeline-empty"><p>未找到相关工艺记录</p></div>';
        return;
    }
    
    const firing = AppState.firing.find(f => f.id === inspection.firingId);
    let decorating = null;
    let forming = null;
    let material = null;
    
    if (firing && firing.decoratingIds) {
        decorating = AppState.decorating.find(d => d.id === firing.decoratingIds[0]);
        if (decorating) {
            forming = AppState.forming.find(f => f.id === decorating.formingId);
            if (forming) {
                material = AppState.materials.find(m => m.id === forming.materialId);
            }
        }
    }
    
    const sales = AppState.sales.find(s => s.productId === productId);
    
    const gradeClass = {
        '珍品': 'grade-rare',
        '精品': 'grade-fine',
        '正品': 'grade-normal',
        '次品': 'grade-defect'
    };
    
    resultDiv.innerHTML = `
        <div class="trace-info">
            <div class="trace-info-item">
                <span class="trace-info-label">产品编号</span>
                <span class="trace-info-value">${productId}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">器型名称</span>
                <span class="trace-info-value">${inspection.vesselType}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">成品等级</span>
                <span class="trace-info-value"><span class="grade-badge ${gradeClass[inspection.grade] || ''}">${inspection.grade}级</span></span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">实际尺寸</span>
                <span class="trace-info-value">${inspection.actualHeight}×${inspection.actualDiameter} cm</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">烧成重量</span>
                <span class="trace-info-value">${inspection.actualWeight} g</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">检验员</span>
                <span class="trace-info-value">${inspection.inspector}</span>
            </div>
        </div>
        ${sales ? `
        <div class="trace-info">
            <div class="trace-info-item">
                <span class="trace-info-label">销售单号</span>
                <span class="trace-info-value">${sales.id}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">购买客户</span>
                <span class="trace-info-value">${sales.customerName}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">成交价格</span>
                <span class="trace-info-value">¥${sales.price.toLocaleString()}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">销售人员</span>
                <span class="trace-info-value">${sales.salesperson}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">收藏证书</span>
                <span class="trace-info-value">${sales.certNo || '无'}</span>
            </div>
            <div class="trace-info-item">
                <span class="trace-info-label">销售日期</span>
                <span class="trace-info-value">${formatDate(sales.createTime)}</span>
            </div>
        </div>
        ` : ''}
    `;
    
    const timelineItems = [];
    
    if (material) {
        timelineItems.push({
            icon: '土',
            title: '泥料制备',
            date: material.createTime,
            desc: `${material.name} 入库，产地 ${material.origin}，重量 ${material.weight}kg',
            detail: `编号: ${material.id} | 含水率: ${material.moisture}% | 陈腐: ${material.agingDays}天`
        });
    }
    
    if (forming) {
        timelineItems.push({
            icon: '轮',
            title: `${forming.method}成型',
            date: forming.createTime,
            desc: `${forming.vesselType} 成型，匠人 ${forming.artisan}',
            detail: `编号: ${forming.id} | 数量: ${forming.quantity}件 | 尺寸: ${forming.height}×${forming.diameter}cm`
        });
    }
    
    if (decorating) {
        timelineItems.push({
            icon: '青',
            title: `${decorating.method}装饰',
            date: decorating.createTime,
            desc: `纹饰: ${decorating.pattern || '素面'}，画师 ${decorating.painter}',
            detail: `编号: ${decorating.id} | 釉料: ${decorating.glazeType} | 款识: ${decorating.markType}`
        });
    }
    
    if (firing) {
        timelineItems.push({
            icon: '窑',
            title: `${firing.kilnType}烧制',
            date: firing.startTime,
            desc: `${firing.kilnType} ${firing.kilnNo} 烧制，把桩师傅 ${firing.fireMaster}',
            detail: `窑次: ${firing.id} | 最高温: ${firing.maxTemp}℃ | 用时: ${firing.firingHours}小时 | 位置: ${firing.kilnPosition}`
        });
    }
    
    timelineItems.push({
        icon: '检',
        title: '成品检验',
        date: inspection.createTime,
        desc: `成品等级: ${inspection.grade}级，检验员 ${inspection.inspector}`,
        detail: `缺陷: ${inspection.defects.join('、') || '无'} | 变形: ${inspection.deformationLevel}`
    });
    
    if (sales) {
        timelineItems.push({
            icon: '销',
            title: '艺术陶瓷销售',
            date: sales.createTime,
            desc: `客户 ${sales.customerName} 购买，价格 ¥${sales.price.toLocaleString()}`,
            detail: `销售单号: ${sales.id} | 客户类型: ${sales.customerType} | 证书: ${sales.certNo || '无'}`
        });
    }
    
    timelineDiv.innerHTML = timelineItems.map(item => `
        <div class="timeline-item">
            <div class="timeline-dot">${item.icon}</div>
            <div class="timeline-content">
                <div class="timeline-title">
                    ${item.title}
                    <span class="timeline-date">${formatDateTime(item.date)}</span>
                </div>
                <div class="timeline-desc">${item.desc}</div>
                <div class="timeline-detail">${item.detail}</div>
            </div>
        </div>
    `).join('');
    
    showToast('产品溯源查询完成！');
}

function updateSalesStats() {
    const total = AppState.sales.reduce((sum, s) => sum + s.price, 0);
    const count = AppState.sales.length;
    const avg = count > 0 ? (total / count).toFixed(0) : 0;
    const max = count > 0 ? Math.max(...AppState.sales.map(s => s.price)) : 0;
    
    document.getElementById('totalSales').textContent = total.toLocaleString();
    document.getElementById('salesCount').textContent = count;
    document.getElementById('avgPrice').textContent = avg.toLocaleString();
    document.getElementById('maxSales').textContent = max.toLocaleString();
}

function initSampleData() {
    if (AppState.materials.length === 0) {
        const sampleMaterials = [
            { id: 'NL-2026-001', name: '高岭土', origin: '景德镇高岭村', weight: 500, moisture: 22, agingDays: 30, remark: '优质高岭土，白度高，可塑性好', status: '可用', createTime: new Date(Date.now() - 86400000 * 30).toISOString() },
            { id: 'NL-2026-002', name: '瓷石', origin: '景德镇瑶里', weight: 300, moisture: 20, agingDays: 25, remark: '二元配方原料', status: '可用', createTime: new Date(Date.now() - 86400000 * 25).toISOString() },
            { id: 'NL-2026-003', name: '紫金土', origin: '景德镇三宝蓬', weight: 100, moisture: 18, agingDays: 20, remark: '用于胎质配色', status: '可用', createTime: new Date(Date.now() - 86400000 * 20).toISOString() }
        ];
        AppState.materials = sampleMaterials;
        Storage.set('materials', AppState.materials);
    }
    
    if (AppState.forming.length === 0) {
        const sampleForming = [
            { id: 'CX-2026-001', vesselType: '梅瓶', materialId: 'NL-2026-001', materialName: '高岭土', method: '手工拉坯', artisan: '李大师', quantity: 5, height: 35, diameter: 12, weight: 800, dryingMethod: '自然阴干', dryingDays: 10, status: '装饰完成', createTime: new Date(Date.now() - 86400000 * 20).toISOString() },
            { id: 'CX-2026-002', vesselType: '玉壶春', materialId: 'NL-2026-001', materialName: '高岭土', method: '利坯', artisan: '王师傅', quantity: 8, height: 28, diameter: 10, weight: 500, dryingMethod: '恒温干燥', dryingDays: 7, status: '装饰完成', createTime: new Date(Date.now() - 86400000 * 18).toISOString() },
            { id: 'CX-2026-003', vesselType: '天球瓶', materialId: 'NL-2026-002', materialName: '瓷石', method: '手工拉坯', artisan: '张大师', quantity: 3, height: 40, diameter: 15, weight: 1200, dryingMethod: '自然阴干', dryingDays: 14, status: '装饰完成', createTime: new Date(Date.now() - 86400000 * 15).toISOString() }
        ];
        AppState.forming = sampleForming;
        Storage.set('forming', AppState.forming);
    }
    
    if (AppState.decorating.length === 0) {
        const sampleDecorating = [
            { id: 'ZS-2026-001', formingId: 'CX-2026-001', vesselType: '梅瓶', method: '青花釉里红', pattern: '缠枝莲纹', painter: '陈画师', glazeType: '透明釉', glazeMethod: '浸釉', glazeThickness: 1.5, markType: '年号款', markContent: '景德镇制', markPosition: '底足', status: '烧制完成', createTime: new Date(Date.now() - 86400000 * 12).toISOString() },
            { id: 'ZS-2026-002', formingId: 'CX-2026-002', vesselType: '玉壶春', method: '青花', pattern: '山水人物', painter: '刘画师', glazeType: '影青釉', glazeMethod: '喷釉', glazeThickness: 1.2, markType: '堂名款', markContent: '雅雨堂', markPosition: '底足', status: '烧制完成', createTime: new Date(Date.now() - 86400000 * 10).toISOString() },
            { id: 'ZS-2026-003', formingId: 'CX-2026-003', vesselType: '天球瓶', method: '粉彩', pattern: '龙凤呈祥', painter: '赵画师', glazeType: '白釉', glazeMethod: '刷釉', glazeThickness: 1.0, markType: '吉言款', markContent: '福寿康宁', markPosition: '肩部', status: '烧制完成', createTime: new Date(Date.now() - 86400000 * 8).toISOString() }
        ];
        AppState.decorating = sampleDecorating;
        Storage.set('decorating', AppState.decorating);
    }
    
    if (AppState.firing.length === 0) {
        const sampleFiring = [
            { id: 'YS-2026-001', kilnType: '柴窑', kilnNo: '一号柴窑', saggarType: '瓷质匣钵', kilnPosition: '中膛', loadQuantity: 16, decoratingIds: ['ZS-2026-001', 'ZS-2026-002', 'ZS-2026-003'], atmosphere: '还原焰', maxTemp: 1320, firingHours: 48, fireMaster: '黄把桩', status: '已出窑', startTime: new Date(Date.now() - 86400000 * 7).toISOString(), endTime: new Date(Date.now() - 86400000 * 5).toISOString() }
        ];
        AppState.firing = sampleFiring;
        Storage.set('firing', AppState.firing);
    }
    
    if (AppState.inspection.length === 0) {
        const sampleInspection = [
            { id: 'JY-2026-001', firingId: 'YS-2026-001', productId: 'CP-2026-001', vesselType: '梅瓶', defects: ['无缺陷'], deformationLevel: '无', actualHeight: 34.5, actualDiameter: 11.8, actualWeight: 680, grade: '珍品', remark: '釉色温润，青花发色纯正，釉里红鲜艳，实为难得佳品', inspector: '钱检验', status: '已检验', createTime: new Date(Date.now() - 86400000 * 4).toISOString() },
            { id: 'JY-2026-002', firingId: 'YS-2026-001', productId: 'CP-2026-002', vesselType: '玉壶春', defects: ['轻微变形'], deformationLevel: '轻微', actualHeight: 27.8, actualDiameter: 9.9, actualWeight: 420, grade: '精品', remark: '器型略有变形，但不影响整体美观，青花层次分明', inspector: '钱检验', status: '已检验', createTime: new Date(Date.now() - 86400000 * 3).toISOString() },
            { id: 'JY-2026-003', firingId: 'YS-2026-001', productId: 'CP-2026-003', vesselType: '天球瓶', defects: ['无缺陷'], deformationLevel: '无', actualHeight: 39.8, actualDiameter: 14.9, actualWeight: 980, grade: '精品', remark: '粉彩色彩艳丽，画工精细，龙凤栩栩如生', inspector: '孙检验', status: '已检验', createTime: new Date(Date.now() - 86400000 * 2).toISOString() }
        ];
        AppState.inspection = sampleInspection;
        Storage.set('inspection', AppState.inspection);
    }
    
    if (AppState.orders.length === 0) {
        const sampleOrders = [
            { id: 'DD-2026-001', customerName: '王先生', customerPhone: '13800138001', orderType: '全套定制', customVessel: '梅瓶', quantity: 2, customHeight: 38, customDiameter: 14, customPattern: '青花缠枝莲加开光山水', customGlaze: '青花瓷', customMarkType: '人名款', customMark: '王氏珍藏', customFiring: '柴窑', minPrice: 8000, maxPrice: 15000, deliveryDate: '2026-08-15', remark: '用于收藏，要求柴窑烧制，需大师亲制', deposit: 5000, status: '制作中', progress: 3, createTime: new Date(Date.now() - 86400000 * 10).toISOString() },
            { id: 'DD-2026-002', customerName: '雅集轩', customerPhone: '010-88888888', orderType: '器型定制', customVessel: '茶具套装', quantity: 10, customHeight: 0, customDiameter: 0, customPattern: '素面', customGlaze: '影青釉', customMarkType: '堂名款', customMark: '雅集轩珍藏', customFiring: '气窑', minPrice: 20000, maxPrice: 30000, deliveryDate: '2026-07-30', remark: '企业高端礼品定制，每套含盖碗、公道杯、品茗杯6只', deposit: 10000, status: '待确认', progress: 0, createTime: new Date(Date.now() - 86400000 * 5).toISOString() }
        ];
        AppState.orders = sampleOrders;
        Storage.set('orders', AppState.orders);
    }
    
    if (AppState.sales.length === 0) {
        const sampleSales = [
            { id: 'XS-2026-001', productId: 'CP-2026-001', vesselType: '梅瓶', grade: '珍品', customerName: '李收藏家', customerType: '个人收藏', price: 28800, paymentMethod: '银行转账', salesperson: '周经理', shippingMethod: '专人配送', insurance: 30000, remark: 'VIP客户，需精美包装并附收藏证书', certNo: 'CC-2026-001', createTime: new Date(Date.now() - 86400000 * 1).toISOString() }
        ];
        AppState.sales = sampleSales;
        Storage.set('sales', AppState.sales);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    initDate();
    initNavigation();
    initModal();
    initSampleData();
    
    initMaterialForm();
    initFormingForm();
    initDecoratingForm();
    initFiringForm();
    initInspectionForm();
    initOrderForm();
    initSalesForm();
    
    navigateTo('material');
});