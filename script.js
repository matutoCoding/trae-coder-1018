const Storage = {
    get(key) {
        try {
            const val = localStorage.getItem(key);
            return val ? JSON.parse(val) : null;
        } catch (e) {
            return null;
        }
    },
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

function showToast(message, type) {
    type = type || 'success';
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(function() { toast.remove(); }, 300);
    }, 3000);
}

function formatDate(date) {
    date = date || new Date();
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

function formatDateTime(date) {
    date = date || new Date();
    const d = new Date(date);
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return formatDate(d) + ' ' + h + ':' + mi;
}

function generateId(prefix) {
    const year = new Date().getFullYear();
    const num = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
    return prefix + '-' + year + '-' + num;
}

function initNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            const pageId = tab.dataset.page;
            navigateTo(pageId);
        });
    });
}

function navigateTo(pageId) {
    const tabs = document.querySelectorAll('.nav-tab');
    const pages = document.querySelectorAll('.page');
    tabs.forEach(function(tab) {
        if (tab.dataset.page === pageId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    pages.forEach(function(page) {
        if (page.id === pageId) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
        }
    });
    AppState.currentPage = pageId;

    if (pageId === 'forming') {
        updateFormingMaterialSelect();
    } else if (pageId === 'decorating') {
        updateLinkFormingSelect();
    } else if (pageId === 'firing') {
        updateLinkDecoratingCheckboxes();
        setTimeout(drawFiringChart, 100);
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
    document.getElementById('modal').addEventListener('click', function(e) {
        if (e.target.id === 'modal') closeModal();
    });
}

function initMaterialForm() {
    const form = document.getElementById('materialForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const moistureVal = parseFloat(document.getElementById('moisture').value) || 0;
        const agingVal = parseInt(document.getElementById('agingDays').value) || 0;
        const weightVal = parseFloat(document.getElementById('materialWeight').value);

        const material = {
            id: document.getElementById('materialId').value || generateId('NL'),
            name: document.getElementById('materialName').value,
            origin: document.getElementById('materialOrigin').value,
            weight: weightVal,
            moisture: moistureVal,
            agingDays: agingVal,
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#4A5568;">暂无泥料数据，请先登记</td></tr>';
        return;
    }

    AppState.materials.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const statusClass = item.weight > 0 ? 'status-success' : 'status-warning';
        const statusText = item.weight > 0 ? '可用' : '已用完';

        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.name + '</td>' +
            '<td>' + item.origin + '</td>' +
            '<td>' + item.weight.toFixed(1) + '</td>' +
            '<td>' + item.moisture + '%</td>' +
            '<td>' + item.agingDays + '天</td>' +
            '<td><span class="status-badge ' + statusClass + '">' + statusText + '</span></td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewMaterialDetail(' + index + ')">详情</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="deleteMaterial(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function viewMaterialDetail(index) {
    const item = AppState.materials[index];
    let html =
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">泥料编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">泥料名称</span><span class="detail-value">' + item.name + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">产地来源</span><span class="detail-value">' + item.origin + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">库存数量</span><span class="detail-value">' + item.weight.toFixed(1) + ' kg</span></div>' +
            '<div class="detail-item"><span class="detail-label">含水率</span><span class="detail-value">' + item.moisture + '%</span></div>' +
            '<div class="detail-item"><span class="detail-label">陈腐天数</span><span class="detail-value">' + item.agingDays + ' 天</span></div>' +
            '<div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">' + item.status + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">' + formatDateTime(item.createTime) + '</span></div>' +
        '</div>';
    if (item.remark) {
        html += '<p style="margin-top:16px;"><strong>备注：</strong>' + item.remark + '</p>';
    }
    showModal('泥料详情', html);
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
    AppState.materials.forEach(function(item) {
        if (item.weight > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name + ' (' + item.id + ') - 库存: ' + item.weight.toFixed(1) + 'kg';
            select.appendChild(option);
        }
    });
}

function initFormingForm() {
    const form = document.getElementById('formingForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const materialId = document.getElementById('formingMaterial').value;
        const material = AppState.materials.find(function(m) { return m.id === materialId; });
        const qty = parseInt(document.getElementById('formingQuantity').value) || 0;
        const hVal = parseFloat(document.getElementById('height').value) || 0;
        const dVal = parseFloat(document.getElementById('diameter').value) || 0;
        const wVal = parseFloat(document.getElementById('formingWeight').value) || 0;
        const dryVal = parseInt(document.getElementById('dryingDays').value) || 0;

        if (material) {
            const consume = qty * 0.5;
            material.weight = Math.max(0, material.weight - consume);
            Storage.set('materials', AppState.materials);
            renderMaterialList();
        }

        const forming = {
            id: document.getElementById('formingId').value || generateId('CX'),
            vesselType: document.getElementById('vesselType').value,
            materialId: materialId,
            materialName: material ? material.name : '',
            method: document.getElementById('formingMethod').value,
            artisan: document.getElementById('artisan').value,
            quantity: qty,
            height: hVal,
            diameter: dVal,
            weight: wVal,
            dryingMethod: document.getElementById('dryingMethod').value,
            dryingDays: dryVal,
            status: '待装饰',
            createTime: new Date().toISOString()
        };

        AppState.forming.unshift(forming);
        Storage.set('forming', AppState.forming);

        renderFormingList();
        updateLinkFormingSelect();
        updateFormingMaterialSelect();

        form.reset();
        showToast('成型记录成功！库存已扣减');
    });

    renderFormingList();
}

function renderFormingList() {
    const tbody = document.getElementById('formingList');
    tbody.innerHTML = '';

    if (AppState.forming.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#4A5568;">暂无成型记录，请先登记</td></tr>';
        return;
    }

    const statusMap = {
        '待装饰': 'status-info',
        '装饰完成': 'status-warning',
        '待烧制': 'status-info',
        '烧制完成': 'status-success'
    };

    AppState.forming.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const cls = statusMap[item.status] || 'status-info';
        const sizeStr = item.height + '×' + item.diameter + 'cm';

        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.vesselType + '</td>' +
            '<td>' + item.method + '</td>' +
            '<td>' + item.artisan + '</td>' +
            '<td>' + item.quantity + '</td>' +
            '<td>' + sizeStr + '</td>' +
            '<td>' + item.dryingMethod + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + item.status + '</span></td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewFormingDetail(' + index + ')">详情</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="deleteForming(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function viewFormingDetail(index) {
    const item = AppState.forming[index];
    const html =
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">成型编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">器型名称</span><span class="detail-value">' + item.vesselType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">使用泥料</span><span class="detail-value">' + item.materialName + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">成型工艺</span><span class="detail-value">' + item.method + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">匠人</span><span class="detail-value">' + item.artisan + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">数量</span><span class="detail-value">' + item.quantity + ' 件</span></div>' +
            '<div class="detail-item"><span class="detail-label">尺寸</span><span class="detail-value">' + item.height + '×' + item.diameter + ' cm</span></div>' +
            '<div class="detail-item"><span class="detail-label">单件重量</span><span class="detail-value">' + item.weight + ' g</span></div>' +
            '<div class="detail-item"><span class="detail-label">干燥方式</span><span class="detail-value">' + item.dryingMethod + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">干燥天数</span><span class="detail-value">' + item.dryingDays + ' 天</span></div>' +
            '<div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">' + item.status + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">' + formatDateTime(item.createTime) + '</span></div>' +
        '</div>';
    showModal('成型详情', html);
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
    AppState.forming.forEach(function(item) {
        if (item.status === '待装饰') {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.vesselType + ' (' + item.id + ') - ' + item.artisan;
            select.appendChild(option);
        }
    });
}

function initDecoratingForm() {
    const form = document.getElementById('decoratingForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const formingId = document.getElementById('linkForming').value;
        const forming = AppState.forming.find(function(f) { return f.id === formingId; });
        const thickVal = parseFloat(document.getElementById('glazeThickness').value) || 0;

        const decorating = {
            id: document.getElementById('decoratingId').value || generateId('ZS'),
            formingId: formingId,
            vesselType: forming ? forming.vesselType : '',
            method: document.getElementById('decorateMethod').value,
            pattern: document.getElementById('pattern').value,
            painter: document.getElementById('painter').value,
            glazeType: document.getElementById('glazeType').value,
            glazeMethod: document.getElementById('glazeMethod').value,
            glazeThickness: thickVal,
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
        updateLinkFormingSelect();

        form.reset();
        showToast('装饰记录成功！');
    });

    renderDecoratingList();
}

function renderDecoratingList() {
    const tbody = document.getElementById('decoratingList');
    tbody.innerHTML = '';

    if (AppState.decorating.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:40px;color:#4A5568;">暂无装饰记录，请先登记</td></tr>';
        return;
    }

    const statusMap = {
        '待烧制': 'status-warning',
        '烧制中': 'status-info',
        '烧制完成': 'status-success'
    };

    AppState.decorating.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const cls = statusMap[item.status] || 'status-info';
        const markText = item.markType !== '无款' ? item.markType + ': ' + item.markContent : '无款';

        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.vesselType + '</td>' +
            '<td>' + item.method + '</td>' +
            '<td>' + (item.pattern || '无') + '</td>' +
            '<td>' + item.painter + '</td>' +
            '<td>' + item.glazeType + '</td>' +
            '<td>' + markText + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + item.status + '</span></td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewDecoratingDetail(' + index + ')">详情</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="deleteDecorating(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function viewDecoratingDetail(index) {
    const item = AppState.decorating[index];
    const markText = item.markType !== '无款' ? item.markType + ': ' + item.markContent + ' (' + item.markPosition + ')' : '无款';
    const html =
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">装饰编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">器型</span><span class="detail-value">' + item.vesselType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">装饰工艺</span><span class="detail-value">' + item.method + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">纹饰图案</span><span class="detail-value">' + (item.pattern || '无') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">画师</span><span class="detail-value">' + item.painter + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">釉料种类</span><span class="detail-value">' + item.glazeType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">施釉方法</span><span class="detail-value">' + item.glazeMethod + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">釉层厚度</span><span class="detail-value">' + item.glazeThickness + ' mm</span></div>' +
            '<div class="detail-item"><span class="detail-label">款识</span><span class="detail-value">' + markText + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">' + item.status + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">登记时间</span><span class="detail-value">' + formatDateTime(item.createTime) + '</span></div>' +
        '</div>';
    showModal('装饰详情', html);
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
    const available = AppState.decorating.filter(function(item) { return item.status === '待烧制'; });

    if (available.length === 0) {
        container.innerHTML = '<p style="color:#4A5568;text-align:center;padding:20px;">暂无待烧制的坯体</p>';
        return;
    }

    available.forEach(function(item) {
        const label = document.createElement('label');
        label.className = 'checkbox-item';
        label.innerHTML =
            '<input type="checkbox" name="decoratingItems" value="' + item.id + '">' +
            '<span>' + item.vesselType + ' (' + item.id + ')</span>';
        container.appendChild(label);
    });
}

function initFiringForm() {
    const form = document.getElementById('firingForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const selectedItems = Array.from(document.querySelectorAll('input[name="decoratingItems"]:checked')).map(function(cb) { return cb.value; });

        if (selectedItems.length === 0) {
            showToast('请至少选择一个待烧制的坯体', 'warning');
            return;
        }

        const hoursVal = parseFloat(document.getElementById('firingHours').value) || 0;

        const firing = {
            id: document.getElementById('firingId').value || generateId('YS'),
            kilnType: document.getElementById('kilnType').value,
            kilnNo: document.getElementById('kilnNo').value,
            saggarType: document.getElementById('saggarType').value,
            kilnPosition: document.getElementById('kilnPosition').value,
            loadQuantity: parseInt(document.getElementById('loadQuantity').value) || 0,
            decoratingIds: selectedItems,
            atmosphere: document.getElementById('atmosphere').value,
            maxTemp: parseInt(document.getElementById('maxTemp').value) || 0,
            firingHours: hoursVal,
            fireMaster: document.getElementById('fireMaster').value,
            status: '烧制中',
            startTime: new Date().toISOString(),
            endTime: null
        };

        AppState.firing.unshift(firing);
        Storage.set('firing', AppState.firing);

        selectedItems.forEach(function(id) {
            const decorating = AppState.decorating.find(function(d) { return d.id === id; });
            if (decorating) decorating.status = '烧制中';
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#4A5568;">暂无窑次记录，请先登记</td></tr>';
        return;
    }

    const statusMap = {
        '烧制中': 'status-warning',
        '烧制完成': 'status-success',
        '已出窑': 'status-info'
    };

    AppState.firing.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const cls = statusMap[item.status] || 'status-info';
        const outBtn = item.status === '烧制中' ? '<button class="btn btn-sm btn-success" onclick="completeFiring(' + index + ')">出窑</button>' : '';

        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.kilnType + '</td>' +
            '<td>' + item.loadQuantity + '</td>' +
            '<td>' + item.maxTemp + '℃</td>' +
            '<td>' + item.firingHours + 'h</td>' +
            '<td>' + item.fireMaster + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + item.status + '</span></td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewFiringDetail(' + index + ')">详情</button>' +
                    outBtn +
                    '<button class="btn btn-sm btn-danger" onclick="deleteFiring(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function completeFiring(index) {
    if (confirm('确定窑烧完成，要标记为出窑吗？')) {
        const item = AppState.firing[index];
        item.status = '已出窑';
        item.endTime = new Date().toISOString();

        item.decoratingIds.forEach(function(id) {
            const decorating = AppState.decorating.find(function(d) { return d.id === id; });
            if (decorating) decorating.status = '烧制完成';
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
    const vesselList = item.decoratingIds.map(function(id) {
        const d = AppState.decorating.find(function(x) { return x.id === id; });
        return d ? d.vesselType : id;
    }).join(', ');

    let html =
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">窑次编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">窑炉类型</span><span class="detail-value">' + item.kilnType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">窑炉编号</span><span class="detail-value">' + (item.kilnNo || '-') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">匣钵类型</span><span class="detail-value">' + item.saggarType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">装窑位置</span><span class="detail-value">' + item.kilnPosition + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">装坯数量</span><span class="detail-value">' + item.loadQuantity + ' 件</span></div>' +
            '<div class="detail-item"><span class="detail-label">烧成气氛</span><span class="detail-value">' + item.atmosphere + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">最高温度</span><span class="detail-value">' + item.maxTemp + '℃</span></div>' +
            '<div class="detail-item"><span class="detail-label">烧造时间</span><span class="detail-value">' + item.firingHours + ' 小时</span></div>' +
            '<div class="detail-item"><span class="detail-label">把桩师傅</span><span class="detail-value">' + item.fireMaster + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">状态</span><span class="detail-value">' + item.status + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">点火时间</span><span class="detail-value">' + formatDateTime(item.startTime) + '</span></div>' +
        '</div>' +
        '<p style="margin-top:16px;"><strong>烧制器物：</strong>' + vesselList + '</p>';
    if (item.endTime) {
        html += '<p><strong>出窑时间：</strong>' + formatDateTime(item.endTime) + '</p>';
    }
    showModal('窑次详情', html);
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) {
        setTimeout(drawFiringChart, 200);
        return;
    }

    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    const width = rect.width;
    const height = rect.height;
    const padL = 50, padR = 20, padT = 20, padB = 40;
    const cw = width - padL - padR;
    const ch = height - padT - padB;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
        const y = padT + (ch / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(width - padR, y);
        ctx.stroke();
        ctx.fillStyle = '#4A5568';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        const temp = 1400 - 200 * i;
        ctx.fillText(temp + '℃', padL - 5, y + 3);
    }

    const tLabels = ['0h', '10h', '20h', '30h', '40h', '50h', '60h'];
    tLabels.forEach(function(lbl, i) {
        const x = padL + (cw / 6) * i;
        ctx.fillStyle = '#4A5568';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(lbl, x, height - padB + 20);
    });

    const woodData = [
        { x: 0, y: 25 }, { x: 5, y: 300 }, { x: 10, y: 600 },
        { x: 15, y: 800 }, { x: 20, y: 1000 }, { x: 30, y: 1200 },
        { x: 40, y: 1320 }, { x: 48, y: 1320 }, { x: 52, y: 1000 },
        { x: 60, y: 200 }
    ];
    const gasData = [
        { x: 0, y: 25 }, { x: 2, y: 300 }, { x: 5, y: 600 },
        { x: 8, y: 900 }, { x: 12, y: 1200 }, { x: 15, y: 1300 },
        { x: 18, y: 1320 }, { x: 20, y: 1320 }, { x: 24, y: 800 },
        { x: 30, y: 200 }
    ];

    function toX(t) { return padL + (t / 60) * cw; }
    function toY(te) { return padT + ((1400 - te) / 1400) * ch; }

    function drawCurve(data, color) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        data.forEach(function(p, i) {
            const x = toX(p.x);
            const y = toY(p.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        data.forEach(function(p) {
            const x = toX(p.x);
            const y = toY(p.y);
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawCurve(woodData, '#8B0000');
    drawCurve(gasData, '#4682B4');

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
    AppState.firing.forEach(function(item) {
        if (item.status === '已出窑') {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.id + ' - ' + item.kilnType + ' - ' + item.loadQuantity + '件';
            select.appendChild(option);
        }
    });

    select.onchange = function() {
        const firingId = this.value;
        const firing = AppState.firing.find(function(f) { return f.id === firingId; });
        if (firing && firing.decoratingIds.length > 0) {
            const decorating = AppState.decorating.find(function(d) { return d.id === firing.decoratingIds[0]; });
            if (decorating) {
                document.getElementById('inspectVessel').value = decorating.vesselType;
            }
        }
    };
}

function initInspectionForm() {
    const form = document.getElementById('inspectionForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const defects = Array.from(document.querySelectorAll('input[name="defects"]:checked')).map(function(cb) { return cb.value; });

        const hVal = parseFloat(document.getElementById('actualHeight').value) || 0;
        const dVal = parseFloat(document.getElementById('actualDiameter').value) || 0;
        const wVal = parseFloat(document.getElementById('actualWeight').value) || 0;

        const inspection = {
            id: document.getElementById('inspectionId').value || generateId('JY'),
            firingId: document.getElementById('linkFiring').value,
            productId: document.getElementById('productId').value || generateId('CP'),
            vesselType: document.getElementById('inspectVessel').value,
            defects: defects,
            deformationLevel: document.getElementById('deformationLevel').value,
            actualHeight: hVal,
            actualDiameter: dVal,
            actualWeight: wVal,
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
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#4A5568;">暂无检验记录，请先登记</td></tr>';
        return;
    }

    const gradeClass = {
        '珍品': 'grade-rare',
        '精品': 'grade-fine',
        '正品': 'grade-normal',
        '次品': 'grade-defect',
        '废品': 'grade-waste'
    };

    AppState.inspection.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const gClass = gradeClass[item.grade] || '';
        const defectText = item.defects.length > 0 ? item.defects.join('、') : '无缺陷';

        tr.innerHTML =
            '<td>' + item.productId + '</td>' +
            '<td>' + item.vesselType + '</td>' +
            '<td>' + defectText + '</td>' +
            '<td><span class="grade-badge ' + gClass + '">' + item.grade + '级</span></td>' +
            '<td>' + item.inspector + '</td>' +
            '<td>' + formatDate(item.createTime) + '</td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewInspectionDetail(' + index + ')">详情</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="deleteInspection(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function viewInspectionDetail(index) {
    const item = AppState.inspection[index];
    const defectText = item.defects.length > 0 ? item.defects.join('、') : '无缺陷';
    const gradeClass = {
        '珍品': 'grade-rare', '精品': 'grade-fine', '正品': 'grade-normal',
        '次品': 'grade-defect', '废品': 'grade-waste'
    };
    const gClass = gradeClass[item.grade] || '';

    let html =
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">检验编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">产品编号</span><span class="detail-value">' + item.productId + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">器型</span><span class="detail-value">' + item.vesselType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">缺陷</span><span class="detail-value">' + defectText + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">变形程度</span><span class="detail-value">' + item.deformationLevel + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">实际尺寸</span><span class="detail-value">' + item.actualHeight + '×' + item.actualDiameter + ' cm</span></div>' +
            '<div class="detail-item"><span class="detail-label">实际重量</span><span class="detail-value">' + item.actualWeight + ' g</span></div>' +
            '<div class="detail-item"><span class="detail-label">成品等级</span><span class="grade-badge ' + gClass + '">' + item.grade + '级</span></div>' +
            '<div class="detail-item"><span class="detail-label">检验员</span><span class="detail-value">' + item.inspector + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">检验时间</span><span class="detail-value">' + formatDateTime(item.createTime) + '</span></div>' +
        '</div>';
    if (item.remark) {
        html += '<p style="margin-top:16px;"><strong>评估说明：</strong>' + item.remark + '</p>';
    }
    showModal('检验详情', html);
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
    const rare = AppState.inspection.filter(function(i) { return i.grade === '珍品'; }).length;
    const fine = AppState.inspection.filter(function(i) { return i.grade === '精品'; }).length;
    const normal = AppState.inspection.filter(function(i) { return i.grade === '正品'; }).length;
    const defect = AppState.inspection.filter(function(i) { return i.grade === '次品'; }).length;
    const waste = AppState.inspection.filter(function(i) { return i.grade === '废品'; }).length;

    const total = AppState.inspection.length;
    const pass = total - waste;
    const rate = total > 0 ? ((pass / total) * 100).toFixed(1) : 0;

    document.getElementById('statRare').textContent = rare;
    document.getElementById('statFine').textContent = fine;
    document.getElementById('statNormal').textContent = normal;
    document.getElementById('statDefect').textContent = defect;
    document.getElementById('statWaste').textContent = waste;
    document.getElementById('statRate').textContent = rate;

    let defD = 0, defC = 0, defG = 0, defB = 0;
    AppState.inspection.forEach(function(item) {
        item.defects.forEach(function(d) {
            if (d === '变形') defD++;
            if (d === '开裂') defC++;
            if (d === '缩釉') defG++;
            if (d === '气泡') defB++;
        });
    });

    const maxD = Math.max(defD, defC, defG, defB, 1);

    document.getElementById('countDeformation').textContent = defD;
    document.getElementById('barDeformation').style.width = (defD / maxD * 100) + '%';
    document.getElementById('countCrack').textContent = defC;
    document.getElementById('barCrack').style.width = (defC / maxD * 100) + '%';
    document.getElementById('countGlaze').textContent = defG;
    document.getElementById('barGlaze').style.width = (defG / maxD * 100) + '%';
    document.getElementById('countBubble').textContent = defB;
    document.getElementById('barBubble').style.width = (defB / maxD * 100) + '%';
}

function initOrderForm() {
    const form = document.getElementById('orderForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const qty = parseInt(document.getElementById('orderQuantity').value) || 0;
        const hVal = parseFloat(document.getElementById('customHeight').value) || 0;
        const dVal = parseFloat(document.getElementById('customDiameter').value) || 0;
        const minP = parseFloat(document.getElementById('minPrice').value) || 0;
        const maxP = parseFloat(document.getElementById('maxPrice').value) || 0;
        const dep = parseFloat(document.getElementById('deposit').value) || 0;

        const order = {
            id: document.getElementById('orderId').value || generateId('DD'),
            customerName: document.getElementById('customerName').value,
            customerPhone: document.getElementById('customerPhone').value,
            orderType: document.getElementById('orderType').value,
            customVessel: document.getElementById('customVessel').value,
            quantity: qty,
            customHeight: hVal,
            customDiameter: dVal,
            customPattern: document.getElementById('customPattern').value,
            customGlaze: document.getElementById('customGlaze').value,
            customMarkType: document.getElementById('customMarkType').value,
            customMark: document.getElementById('customMark').value,
            customFiring: document.getElementById('customFiring').value,
            minPrice: minP,
            maxPrice: maxP,
            deliveryDate: document.getElementById('deliveryDate').value,
            remark: document.getElementById('orderRemark').value,
            deposit: dep,
            status: '待确认',
            progress: 0,
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
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:#4A5568;">暂无订单，请先创建</td></tr>';
        return;
    }

    const statusMap = {
        '待确认': 'status-warning', '已确认': 'status-info', '制作中': 'status-info',
        '已完成': 'status-success', '已交付': 'status-success'
    };
    const progressSteps = ['订单确认', '泥料准备', '成型制作', '装饰施釉', '入窑烧制', '成品检验', '交付客户'];

    AppState.orders.forEach(function(item, index) {
        const tr = document.createElement('tr');
        const cls = statusMap[item.status] || 'status-info';
        const stepLabel = progressSteps[item.progress] || '已完成';
        const progWidth = (item.progress / 6 * 100) + '%';
        const advBtn = item.progress < 6 ? '<button class="btn btn-sm btn-success" onclick="advanceOrder(' + index + ')">推进</button>' : '';

        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.customerName + '</td>' +
            '<td>' + item.customVessel + ' - ' + item.orderType + '</td>' +
            '<td>' + item.quantity + '</td>' +
            '<td>' + item.deliveryDate + '</td>' +
            '<td><span class="status-badge ' + cls + '">' + item.status + '</span></td>' +
            '<td>' +
                '<div style="width:100px;background:#E2E8F0;border-radius:4px;height:8px;">' +
                    '<div style="width:' + progWidth + ';height:100%;background:linear-gradient(90deg,#165DFF,#48BB78);border-radius:4px;"></div>' +
                '</div>' +
                '<small style="color:#4A5568;">' + stepLabel + '</small>' +
            '</td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="viewOrderDetail(' + index + ')">详情</button>' +
                    advBtn +
                    '<button class="btn btn-sm btn-danger" onclick="deleteOrder(' + index + ')">删除</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function viewOrderDetail(index) {
    const item = AppState.orders[index];
    const progressSteps = ['订单确认', '泥料准备', '成型制作', '装饰施釉', '入窑烧制', '成品检验', '交付客户'];
    const icons = ['订', '土', '轮', '青', '窑', '检', '送'];

    let trackerHTML = '';
    for (let i = 0; i < progressSteps.length; i++) {
        let cls = 'progress-step';
        if (i < item.progress) cls += ' completed';
        if (i === item.progress) cls += ' active';
        trackerHTML +=
            '<div class="' + cls + '">' +
                '<div class="step-icon">' + icons[i] + '</div>' +
                '<div class="step-label">' + progressSteps[i] + '</div>' +
            '</div>';
        if (i < progressSteps.length - 1) {
            const lineCls = i < item.progress ? 'progress-line completed' : 'progress-line';
            trackerHTML += '<div class="' + lineCls + '"></div>';
        }
    }

    const markText = item.customMarkType !== '无' ? item.customMarkType + ': ' + item.customMark : '无特殊要求';

    let html =
        '<div class="progress-tracker" style="padding:10px 0;">' + trackerHTML + '</div>' +
        '<div class="detail-grid">' +
            '<div class="detail-item"><span class="detail-label">订单编号</span><span class="detail-value">' + item.id + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">客户姓名</span><span class="detail-value">' + item.customerName + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">联系电话</span><span class="detail-value">' + item.customerPhone + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">定制类型</span><span class="detail-value">' + item.orderType + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">定制器型</span><span class="detail-value">' + item.customVessel + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">定制数量</span><span class="detail-value">' + item.quantity + ' 件</span></div>' +
            '<div class="detail-item"><span class="detail-label">尺寸要求</span><span class="detail-value">' + item.customHeight + '×' + item.customDiameter + ' cm</span></div>' +
            '<div class="detail-item"><span class="detail-label">纹饰要求</span><span class="detail-value">' + (item.customPattern || '无') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">釉色要求</span><span class="detail-value">' + (item.customGlaze || '无') + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">款识要求</span><span class="detail-value">' + markText + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">烧制要求</span><span class="detail-value">' + item.customFiring + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">价格区间</span><span class="detail-value">' + item.minPrice + '-' + item.maxPrice + ' 元</span></div>' +
            '<div class="detail-item"><span class="detail-label">交付日期</span><span class="detail-value">' + item.deliveryDate + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">已收定金</span><span class="detail-value">' + item.deposit + ' 元</span></div>' +
            '<div class="detail-item"><span class="detail-label">订单状态</span><span class="detail-value">' + item.status + '</span></div>' +
            '<div class="detail-item"><span class="detail-label">创建时间</span><span class="detail-value">' + formatDateTime(item.createTime) + '</span></div>' +
        '</div>';
    if (item.remark) {
        html += '<p style="margin-top:16px;"><strong>特殊要求：</strong>' + item.remark + '</p>';
    }
    showModal('订单详情', html);
}

function advanceOrder(index) {
    const item = AppState.orders[index];
    if (item.progress < 6) {
        item.progress++;
        if (item.progress === 6) item.status = '已完成';
        else item.status = '制作中';
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

    AppState.inspection.forEach(function(item) {
        const sold = AppState.sales.find(function(s) { return s.productId === item.productId; });
        if (item.grade !== '废品' && !sold) {
            const option = document.createElement('option');
            option.value = item.productId;
            option.textContent = item.productId + ' - ' + item.vesselType + ' - ' + item.grade + '级';
            select.appendChild(option);
        }
    });

    select.onchange = function() {
        const productId = this.value;
        const inspection = AppState.inspection.find(function(i) { return i.productId === productId; });
        const infoDiv = document.getElementById('productInfo');

        if (inspection) {
            const gradeClass = {
                '珍品': 'grade-rare', '精品': 'grade-fine', '正品': 'grade-normal', '次品': 'grade-defect'
            };
            const gClass = gradeClass[inspection.grade] || '';
            const defectText = inspection.defects.length > 0 ? inspection.defects.join('、') : '无';

            infoDiv.innerHTML =
                '<div class="product-info-grid">' +
                    '<div class="info-cell"><span class="info-cell-label">产品编号</span><span class="info-cell-value">' + inspection.productId + '</span></div>' +
                    '<div class="info-cell"><span class="info-cell-label">器型</span><span class="info-cell-value">' + inspection.vesselType + '</span></div>' +
                    '<div class="info-cell"><span class="info-cell-label">等级</span><span class="info-cell-value"><span class="grade-badge ' + gClass + '">' + inspection.grade + '级</span></span></div>' +
                    '<div class="info-cell"><span class="info-cell-label">尺寸</span><span class="info-cell-value">' + inspection.actualHeight + '×' + inspection.actualDiameter + 'cm</span></div>' +
                    '<div class="info-cell"><span class="info-cell-label">重量</span><span class="info-cell-value">' + inspection.actualWeight + 'g</span></div>' +
                    '<div class="info-cell"><span class="info-cell-label">缺陷</span><span class="info-cell-value">' + defectText + '</span></div>' +
                '</div>';
        } else {
            infoDiv.innerHTML = '<p>请选择产品</p>';
        }
    };
}

function initSalesForm() {
    const form = document.getElementById('salesForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();

        const productId = document.getElementById('salesProduct').value;
        const inspection = AppState.inspection.find(function(i) { return i.productId === productId; });
        const priceVal = parseFloat(document.getElementById('salesPrice').value) || 0;
        const insVal = parseFloat(document.getElementById('insurance').value) || 0;

        const sales = {
            id: document.getElementById('salesId').value || generateId('XS'),
            productId: productId,
            vesselType: inspection ? inspection.vesselType : '',
            grade: inspection ? inspection.grade : '',
            customerName: document.getElementById('salesCustomer').value,
            customerType: document.getElementById('customerType').value,
            price: priceVal,
            paymentMethod: document.getElementById('paymentMethod').value,
            salesperson: document.getElementById('salesperson').value,
            shippingMethod: document.getElementById('shippingMethod').value,
            insurance: insVal,
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
        if (e.key === 'Enter') document.getElementById('searchTrace').click();
    });
}

function renderSalesList() {
    const tbody = document.getElementById('salesList');
    tbody.innerHTML = '';

    if (AppState.sales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#4A5568;">暂无销售记录，请先登记</td></tr>';
        return;
    }

    AppState.sales.forEach(function(item, index) {
        const tr = document.createElement('tr');
        tr.innerHTML =
            '<td>' + item.id + '</td>' +
            '<td>' + item.productId + '<br><small>' + item.vesselType + '</small></td>' +
            '<td>' + item.customerName + '</td>' +
            '<td>¥' + item.price.toLocaleString() + '</td>' +
            '<td>' + item.salesperson + '</td>' +
            '<td>' + formatDate(item.createTime) + '</td>' +
            '<td>' +
                '<div class="action-btns">' +
                    '<button class="btn btn-sm btn-primary" onclick="showTrace(\'' + item.productId + '\')">溯源</button>' +
                '</div>' +
            '</td>';
        tbody.appendChild(tr);
    });
}

function showTrace(productId) {
    document.getElementById('traceCode').value = productId;
    showTraceResult(productId);
    navigateTo('sales');
}

function showTraceResult(productId) {
    const resultDiv = document.getElementById('traceResult');
    const timelineDiv = document.getElementById('timeline');

    const inspection = AppState.inspection.find(function(i) { return i.productId === productId; });

    if (!inspection) {
        resultDiv.innerHTML =
            '<div class="trace-empty">' +
                '<div class="trace-icon">瓷</div>' +
                '<p style="color:#C53030;">未找到产品 <strong>' + productId + '</strong> 的溯源信息</p>' +
                '<p style="font-size:13px;margin-top:8px;">请检查产品编号是否正确，或该产品尚未完成检验入库</p>' +
            '</div>';
        timelineDiv.innerHTML = '<div class="timeline-empty"><p>未找到相关工艺记录，请确认产品编号后重试</p></div>';
        showToast('未找到该产品的溯源信息', 'warning');
        return;
    }

    const firing = AppState.firing.find(function(f) { return f.id === inspection.firingId; });
    let decorating = null;
    let forming = null;
    let material = null;

    if (firing && firing.decoratingIds && firing.decoratingIds.length > 0) {
        decorating = AppState.decorating.find(function(d) { return d.id === firing.decoratingIds[0]; });
        if (decorating) {
            forming = AppState.forming.find(function(f) { return f.id === decorating.formingId; });
            if (forming) {
                material = AppState.materials.find(function(m) { return m.id === forming.materialId; });
            }
        }
    }

    const sales = AppState.sales.find(function(s) { return s.productId === productId; });

    const gradeClass = {
        '珍品': 'grade-rare', '精品': 'grade-fine', '正品': 'grade-normal', '次品': 'grade-defect'
    };
    const gClass = gradeClass[inspection.grade] || '';

    let resultHTML =
        '<h4 style="color:#165DFF;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #165DFF;">产品基础信息</h4>' +
        '<div class="trace-info">' +
            '<div class="trace-info-item"><span class="trace-info-label">产品编号</span><span class="trace-info-value">' + productId + '</span></div>' +
            '<div class="trace-info-item"><span class="trace-info-label">器型名称</span><span class="trace-info-value">' + inspection.vesselType + '</span></div>' +
            '<div class="trace-info-item"><span class="trace-info-label">成品等级</span><span class="trace-info-value"><span class="grade-badge ' + gClass + '">' + inspection.grade + '级</span></span></div>' +
            '<div class="trace-info-item"><span class="trace-info-label">实际尺寸</span><span class="trace-info-value">' + inspection.actualHeight + '×' + inspection.actualDiameter + ' cm</span></div>' +
            '<div class="trace-info-item"><span class="trace-info-label">烧成重量</span><span class="trace-info-value">' + inspection.actualWeight + ' g</span></div>' +
            '<div class="trace-info-item"><span class="trace-info-label">检验员</span><span class="trace-info-value">' + inspection.inspector + '</span></div>' +
        '</div>';

    if (sales) {
        resultHTML +=
            '<h4 style="color:#2F855A;margin-top:24px;margin-bottom:16px;padding-bottom:8px;border-bottom:2px solid #2F855A;">销售记录</h4>' +
            '<div class="trace-info">' +
                '<div class="trace-info-item"><span class="trace-info-label">销售单号</span><span class="trace-info-value">' + sales.id + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">购买客户</span><span class="trace-info-value">' + sales.customerName + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">客户类型</span><span class="trace-info-value">' + sales.customerType + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">成交价格</span><span class="trace-info-value" style="color:#C53030;font-weight:700;">¥' + sales.price.toLocaleString() + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">销售人员</span><span class="trace-info-value">' + sales.salesperson + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">付款方式</span><span class="trace-info-value">' + sales.paymentMethod + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">收藏证书</span><span class="trace-info-value">' + (sales.certNo || '无') + '</span></div>' +
                '<div class="trace-info-item"><span class="trace-info-label">销售日期</span><span class="trace-info-value">' + formatDate(sales.createTime) + '</span></div>' +
            '</div>';
    }

    resultDiv.innerHTML = resultHTML;

    const timelineItems = [];

    if (material) {
        timelineItems.push({
            icon: '土',
            title: '泥料制备',
            date: material.createTime,
            desc: material.name + '入库',
            detail: '编号: ' + material.id + ' | 产地: ' + material.origin + ' | 重量: ' + material.weight.toFixed(1) + 'kg | 含水率: ' + material.moisture + '% | 陈腐: ' + material.agingDays + '天'
        });
    }

    if (forming) {
        timelineItems.push({
            icon: '轮',
            title: forming.method + '成型',
            date: forming.createTime,
            desc: forming.vesselType + '制作完成',
            detail: '编号: ' + forming.id + ' | 匠人: ' + forming.artisan + ' | 数量: ' + forming.quantity + '件 | 尺寸: ' + forming.height + '×' + forming.diameter + 'cm | 干燥: ' + forming.dryingMethod + ' ' + forming.dryingDays + '天'
        });
    }

    if (decorating) {
        timelineItems.push({
            icon: '青',
            title: decorating.method + '装饰',
            date: decorating.createTime,
            desc: (decorating.pattern || '素面') + '施釉完成',
            detail: '编号: ' + decorating.id + ' | 画师: ' + decorating.painter + ' | 釉料: ' + decorating.glazeType + ' | 施釉: ' + decorating.glazeMethod + ' | 款识: ' + decorating.markType + ' ' + decorating.markContent
        });
    }

    if (firing) {
        timelineItems.push({
            icon: '窑',
            title: firing.kilnType + '烧制',
            date: firing.startTime,
            desc: firing.kilnType + '窑次完成',
            detail: '编号: ' + firing.id + ' | 把桩: ' + firing.fireMaster + ' | 最高温: ' + firing.maxTemp + '℃ | 时长: ' + firing.firingHours + 'h | 气氛: ' + firing.atmosphere + ' | 匣钵: ' + firing.saggarType
        });
    }

    timelineItems.push({
        icon: '检',
        title: '成品检验',
        date: inspection.createTime,
        desc: '评定为' + inspection.grade + '级',
        detail: '编号: ' + inspection.id + ' | 检验员: ' + inspection.inspector + ' | 变形: ' + inspection.deformationLevel + ' | 缺陷: ' + (inspection.defects.length > 0 ? inspection.defects.join('、') : '无')
    });

    if (sales) {
        timelineItems.push({
            icon: '售',
            title: '销售出库',
            date: sales.createTime,
            desc: sales.customerName + '购买',
            detail: '编号: ' + sales.id + ' | 销售: ' + sales.salesperson + ' | 价格: ¥' + sales.price.toLocaleString() + ' | 支付: ' + sales.paymentMethod + ' | 物流: ' + sales.shippingMethod
        });
    }

    if (timelineItems.length === 0) {
        timelineDiv.innerHTML = '<div class="timeline-empty"><p>未找到相关工艺记录</p></div>';
        return;
    }

    let timelineHTML = '';
    timelineItems.forEach(function(item, idx) {
        const isLast = idx === timelineItems.length - 1;
        const lineHTML = isLast ? '' : '<div class="timeline-line"></div>';
        timelineHTML +=
            '<div class="timeline-item">' +
                '<div class="timeline-node">' +
                    '<div class="timeline-dot">' + item.icon + '</div>' +
                    lineHTML +
                '</div>' +
                '<div class="timeline-content">' +
                    '<div class="timeline-header">' +
                        '<span class="timeline-title">' + item.title + '</span>' +
                        '<span class="timeline-date">' + formatDateTime(item.date) + '</span>' +
                    '</div>' +
                    '<div class="timeline-desc">' + item.desc + '</div>' +
                    '<div class="timeline-detail">' + item.detail + '</div>' +
                '</div>' +
            '</div>';
    });

    timelineDiv.innerHTML = timelineHTML;
    showToast('产品溯源查询完成！');
}

function updateSalesStats() {
    const totalS = AppState.sales.length;
    let totalR = 0;
    let maxP = 0;
    AppState.sales.forEach(function(s) {
        totalR += s.price;
        if (s.price > maxP) maxP = s.price;
    });

    const avgP = totalS > 0 ? (totalR / totalS).toFixed(0) : 0;

    document.getElementById('totalSales').textContent = totalR.toLocaleString();
    document.getElementById('salesCount').textContent = totalS;
    document.getElementById('avgPrice').textContent = avgP;
    document.getElementById('maxSales').textContent = maxP.toLocaleString();
}

function initSampleData() {
    if (AppState.materials.length > 0) return;

    const m1 = {
        id: 'NL-2026-001', name: '高岭土瓷泥', origin: '景德镇高岭村',
        weight: 500, moisture: 22, agingDays: 90, remark: '优质高岭土，经三次淘洗',
        status: '可用', createTime: new Date(Date.now() - 86400000 * 120).toISOString()
    };
    const m2 = {
        id: 'NL-2026-002', name: '瓷石釉泥', origin: '景德镇瑶里',
        weight: 200, moisture: 20, agingDays: 60, remark: '釉料专用瓷石',
        status: '可用', createTime: new Date(Date.now() - 86400000 * 90).toISOString()
    };
    const m3 = {
        id: 'NL-2026-003', name: '紫金土', origin: '景德镇柳家湾',
        weight: 100, moisture: 18, agingDays: 120, remark: '用于胎釉装饰',
        status: '可用', createTime: new Date(Date.now() - 86400000 * 60).toISOString()
    };
    AppState.materials = [m1, m2, m3];
    Storage.set('materials', AppState.materials);

    const f1 = {
        id: 'CX-2026-001', vesselType: '青花缠枝莲梅瓶',
        materialId: m1.id, materialName: m1.name, method: '手工拉坯',
        artisan: '王师傅', quantity: 10, height: 35, diameter: 18, weight: 1500,
        dryingMethod: '阴干', dryingDays: 14, status: '装饰完成',
        createTime: new Date(Date.now() - 86400000 * 45).toISOString()
    };
    const f2 = {
        id: 'CX-2026-002', vesselType: '釉里红双鱼纹玉壶春',
        materialId: m1.id, materialName: m1.name, method: '手工拉坯',
        artisan: '李师傅', quantity: 5, height: 28, diameter: 15, weight: 1200,
        dryingMethod: '阴干', dryingDays: 12, status: '待装饰',
        createTime: new Date(Date.now() - 86400000 * 30).toISOString()
    };
    const f3 = {
        id: 'CX-2026-003', vesselType: '青花山水图赏瓶',
        materialId: m1.id, materialName: m1.name, method: '印坯成型',
        artisan: '张师傅', quantity: 8, height: 42, diameter: 22, weight: 2200,
        dryingMethod: '阴干', dryingDays: 15, status: '待装饰',
        createTime: new Date(Date.now() - 86400000 * 20).toISOString()
    };
    AppState.forming = [f1, f2, f3];
    Storage.set('forming', AppState.forming);

    const d1 = {
        id: 'ZS-2026-001', formingId: f1.id, vesselType: f1.vesselType,
        method: '青花手绘', pattern: '缠枝莲纹', painter: '陈画师',
        glazeType: '透明釉', glazeMethod: '浸釉', glazeThickness: 0.8,
        markType: '年号款', markContent: '大清乾隆年制', markPosition: '圈足内',
        status: '烧制完成', createTime: new Date(Date.now() - 86400000 * 30).toISOString()
    };
    AppState.decorating = [d1];
    Storage.set('decorating', AppState.decorating);

    const fr1 = {
        id: 'YS-2026-001', kilnType: '柴窑', kilnNo: '柴-03',
        saggarType: '瓷质匣钵', kilnPosition: '窑位中部',
        loadQuantity: 10, decoratingIds: [d1.id],
        atmosphere: '还原焰', maxTemp: 1320, firingHours: 48,
        fireMaster: '刘把桩', status: '已出窑',
        startTime: new Date(Date.now() - 86400000 * 20).toISOString(),
        endTime: new Date(Date.now() - 86400000 * 18).toISOString()
    };
    AppState.firing = [fr1];
    Storage.set('firing', AppState.firing);

    const i1 = {
        id: 'JY-2026-001', firingId: fr1.id, productId: 'CP-2026-001',
        vesselType: f1.vesselType, defects: [], deformationLevel: '无变形',
        actualHeight: 34.8, actualDiameter: 17.8, actualWeight: 1450,
        grade: '珍品', remark: '青花发色纯正，釉面莹润，器型端正',
        inspector: '赵检验', status: '已检验',
        createTime: new Date(Date.now() - 86400000 * 10).toISOString()
    };
    const i2 = {
        id: 'JY-2026-002', firingId: fr1.id, productId: 'CP-2026-002',
        vesselType: f1.vesselType, defects: ['气泡'], deformationLevel: '轻微',
        actualHeight: 35.2, actualDiameter: 18.1, actualWeight: 1480,
        grade: '精品', remark: '少量针眼气泡，不影响美观',
        inspector: '赵检验', status: '已检验',
        createTime: new Date(Date.now() - 86400000 * 9).toISOString()
    };
    const i3 = {
        id: 'JY-2026-003', firingId: fr1.id, productId: 'CP-2026-003',
        vesselType: f1.vesselType, defects: ['变形'], deformationLevel: '轻微',
        actualHeight: 36.0, actualDiameter: 17.5, actualWeight: 1420,
        grade: '正品', remark: '轻微椭圆变形，使用无影响',
        inspector: '赵检验', status: '已检验',
        createTime: new Date(Date.now() - 86400000 * 8).toISOString()
    };
    AppState.inspection = [i1, i2, i3];
    Storage.set('inspection', AppState.inspection);

    const o1 = {
        id: 'DD-2026-001', customerName: '周先生', customerPhone: '13800138000',
        orderType: '高端定制', customVessel: '青花龙纹天球瓶',
        quantity: 2, customHeight: 55, customDiameter: 40,
        customPattern: '青花五爪龙纹+祥云', customGlaze: '宝石蓝釉',
        customMarkType: '定制款', customMark: '逸云轩珍藏',
        customFiring: '柴窑烧制', minPrice: 80000, maxPrice: 120000,
        deliveryDate: '2026-09-30', remark: '严格按照故宫馆藏天球瓶比例制作',
        deposit: 30000, status: '制作中', progress: 3,
        createTime: new Date(Date.now() - 86400000 * 15).toISOString()
    };
    const o2 = {
        id: 'DD-2026-002', customerName: '清雅轩茶艺馆', customerPhone: '0798-1234567',
        orderType: '批量定制', customVessel: '青瓷品茗杯套装',
        quantity: 50, customHeight: 5, customDiameter: 7,
        customPattern: '素雅无纹', customGlaze: '龙泉青瓷釉',
        customMarkType: '商号款', customMark: '清雅轩',
        customFiring: '气窑烧制', minPrice: 80, maxPrice: 120,
        deliveryDate: '2026-07-30', remark: '每套6只，配礼盒包装',
        deposit: 2000, status: '已确认', progress: 1,
        createTime: new Date(Date.now() - 86400000 * 5).toISOString()
    };
    AppState.orders = [o1, o2];
    Storage.set('orders', AppState.orders);

    const s1 = {
        id: 'XS-2026-001', productId: i1.productId, vesselType: i1.vesselType,
        grade: i1.grade, customerName: '马先生', customerType: '收藏家',
        price: 28800, paymentMethod: '银行转账', salesperson: '吴经理',
        shippingMethod: '顺丰保价', insurance: 500,
        remark: '北京市朝阳区XX路XX号', certNo: 'CERT-2026-0888',
        createTime: new Date(Date.now() - 86400000 * 3).toISOString()
    };
    AppState.sales = [s1];
    Storage.set('sales', AppState.sales);
}

document.addEventListener('DOMContentLoaded', function() {
    initSampleData();
    initNavigation();
    initDate();
    initModal();
    initMaterialForm();
    initFormingForm();
    initDecoratingForm();
    initFiringForm();
    initInspectionForm();
    initOrderForm();
    initSalesForm();
    updateInspectionStats();
    updateSalesStats();
});
