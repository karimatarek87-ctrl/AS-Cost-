(function () {
  'use strict';

  const Data = window.MealCostData;
  const Calc = window.MealCostCalc;
  let state = Data.load();
  let currentPage = 'dashboard';

  const roles = {
    administrator: { name: 'Administrator', description: 'Full access to costing, settings and users.', access: 'All modules', canEditCosts: true, canEditMaterials: true, canAdmin: true },
    cost_controller: { name: 'Cost Controller', description: 'Build recipes and maintain all costing records.', access: 'Costing & reports', canEditCosts: true, canEditMaterials: true, canAdmin: false },
    purchasing: { name: 'Purchasing', description: 'Maintain material packages, prices and suppliers.', access: 'Raw materials', canEditCosts: false, canEditMaterials: true, canAdmin: false },
    manager: { name: 'Management Viewer', description: 'View dashboards, recipes and profitability.', access: 'Read only', canEditCosts: false, canEditMaterials: false, canAdmin: false }
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const num = Calc.n;
  const fmt4 = value => new Intl.NumberFormat('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(num(value));
  const fmt2 = value => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num(value));
  const money = value => `${state.settings.currency} ${fmt4(value)}`;
  const pct = value => `${fmt2(value)}%`;
  const uid = prefix => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const department = id => state.departments.find(item => item.id === id);
  const currentUser = () => state.users.find(user => user.id === state.currentUserId) || state.users[0];
  const permission = () => roles[currentUser()?.role] || roles.manager;
  const initials = name => String(name || '?').split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();

  function persist(message = 'Changes saved on this computer') {
    Data.save(state);
    $('#last-saved').textContent = `Saved ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (message) toast('Saved', message);
  }

  function toast(title, message) {
    $('#toast-title').textContent = title;
    $('#toast-message').textContent = message;
    $('#toast').classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $('#toast').classList.remove('show'), 2600);
  }

  function setOptions(select, items, selected = '', first = '') {
    if (!select) return;
    select.innerHTML = `${first ? `<option value="">${esc(first)}</option>` : ''}${items.map(item => `<option value="${esc(item.id)}" ${item.id === selected ? 'selected' : ''}>${esc(item.name)}</option>`).join('')}`;
  }

  function pageMeta(page) {
    return {
      dashboard: ['COST CONTROL', 'Meal cost overview'], materials: ['PURCHASING', 'Raw materials'], meals: ['RECIPE COSTING', 'Meals & recipes'],
      workforce: ['LABOUR ALLOCATION', 'Salary and wage costs'], expenses: ['OVERHEADS', 'Operating expenses'], users: ['SECURITY', 'Users & roles'], settings: ['SYSTEM', 'Settings & backup']
    }[page];
  }

  function navigate(page) {
    if ((page === 'users' || page === 'settings') && !permission().canAdmin) page = 'dashboard';
    currentPage = page;
    $$('.page').forEach(section => section.classList.toggle('active', section.id === `${page}-page`));
    $$('.nav-item').forEach(button => button.classList.toggle('active', button.dataset.page === page));
    const [kicker, title] = pageMeta(page);
    $('#page-kicker').textContent = kicker;
    $('#page-title').textContent = title;
    $('#sidebar').classList.remove('open');
    renderPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function refreshPermissions() {
    const user = currentUser();
    const access = permission();
    $('#current-user').textContent = user.name;
    $('#current-role').textContent = roles[user.role]?.name || user.role;
    $('#current-avatar').textContent = initials(user.name);
    $$('.admin-only').forEach(el => el.hidden = !access.canAdmin);
    $$('.editor-only').forEach(el => el.hidden = !access.canEditCosts);
    const materialAdd = $('[data-action="add-material"]');
    if (materialAdd) materialAdd.hidden = !access.canEditMaterials;
  }

  function statCard(label, value, note) {
    return `<article class="stat-card"><span>${esc(label)}</span><strong>${value}</strong><small>${esc(note)}</small></article>`;
  }

  function renderAll() {
    refreshPermissions();
    $('#dashboard-period').textContent = state.settings.costingYear;
    renderDashboard();
    renderMaterials();
    renderMeals();
    renderWorkforce();
    renderExpenses();
    renderUsers();
    renderSettings();
  }

  function renderPage(page) {
    ({ dashboard: renderDashboard, materials: renderMaterials, meals: renderMeals, workforce: renderWorkforce, expenses: renderExpenses, users: renderUsers, settings: renderSettings }[page] || (() => {}))();
  }

  function renderDashboard() {
    const costs = state.meals.map(meal => ({ meal, cost: Calc.mealCost(meal, state) }));
    const costedMeals = costs.filter(item => (item.meal.ingredients || []).length);
    const pendingCount = costs.length - costedMeals.length;
    const avgCost = costedMeals.length ? costedMeals.reduce((sum, item) => sum + item.cost.total, 0) / costedMeals.length : 0;
    const annualRevenue = costs.reduce((sum, item) => sum + item.cost.price * num(item.meal.annualQty), 0);
    const annualProfit = costs.reduce((sum, item) => sum + item.cost.profit * num(item.meal.annualQty), 0);
    const totalQty = Calc.totalQuantity(state);
    $('#dashboard-stats').innerHTML = [
      statCard('Active meals', fmt4(state.meals.length), `${pendingCount} imported recipes pending`),
      statCard('Average full unit cost', money(avgCost), 'Materials + labour + expenses'),
      statCard('Annual production basis', fmt4(totalQty), 'Units across all meals'),
      statCard('Estimated annual profit', money(annualProfit), annualRevenue ? `${pct(annualProfit / annualRevenue * 100)} blended margin` : 'No selling values')
    ].join('');

    $('#dashboard-meals').innerHTML = costedMeals.sort((a, b) => b.cost.margin - a.cost.margin).slice(0, 10).map(({ meal, cost }) => `<tr>
      <td><div class="meal-cell"><span class="meal-thumb">${mealEmoji(meal)}</span><div><strong>${esc(meal.name)}</strong><span>${esc(meal.code)}</span></div></div></td>
      <td>${esc(department(meal.departmentId)?.name || 'Unassigned')}</td><td class="money">${money(cost.total)}</td><td class="money">${money(cost.price)}</td>
      <td class="money ${cost.profit >= 0 ? 'positive' : 'negative'}">${money(cost.profit)}</td><td>${pct(cost.margin)}</td><td><span class="status ${cost.profit < 0 ? 'loss' : cost.margin < 20 ? 'warning' : 'good'}">${cost.profit < 0 ? 'Loss' : cost.margin < 20 ? 'Low margin' : 'Healthy'}</span></td>
    </tr>`).join('') || `<tr><td colspan="7" class="empty-state">Add your first meal to see profitability.</td></tr>`;

    const totals = costs.reduce((result, item) => ({ material: result.material + item.cost.material * num(item.meal.annualQty), labour: result.labour + item.cost.labour * num(item.meal.annualQty), expenses: result.expenses + item.cost.expenses * num(item.meal.annualQty) }), { material: 0, labour: 0, expenses: 0 });
    const grand = totals.material + totals.labour + totals.expenses || 1;
    $('#cost-mix').innerHTML = [['Materials', totals.material], ['Labour', totals.labour], ['Expenses', totals.expenses]].map(([label, value]) => `<div class="mix-row"><div class="mix-row-head"><span>${label}</span><b>${pct(value / grand * 100)}</b></div><div class="mix-track"><i style="width:${Math.min(100, value / grand * 100)}%"></i></div></div>`).join('') + `<div class="mix-total"><span>Annual cost loaded</span><strong>${money(grand)}</strong></div>`;

    const warnings = [];
    const incompleteMaterials = state.materials.filter(item => !item.purchasePrice || !item.conversions.length);
    if (incompleteMaterials.length) warnings.push({ text: `${incompleteMaterials.length} raw materials need attention`, detail: 'Missing purchase price or package conversion', page: 'materials' });
    if (pendingCount) warnings.push({ text: `${pendingCount} menu items need recipes`, detail: 'Add ingredients and annual production quantity', page: 'meals' });
    costedMeals.filter(item => item.cost.margin < 20).forEach(item => warnings.push({ text: item.meal.name, detail: `${pct(item.cost.margin)} margin needs review`, page: 'meals' }));
    state.expenses.filter(item => item.method === 'production_qty' && !Calc.expenseBasis(item, state)).forEach(item => warnings.push({ text: item.name, detail: 'No production quantity for allocation', page: 'expenses' }));
    $('#warning-count').textContent = warnings.length;
    $('#warning-list').innerHTML = warnings.slice(0, 5).map(item => `<div class="warning-item"><span class="warning-icon">!</span><div><strong>${esc(item.text)}</strong><span>${esc(item.detail)}</span></div><button class="text-btn" data-page-link="${item.page}">Review →</button></div>`).join('') || `<div class="empty-state">Everything has enough information for costing.</div>`;

    const maxQty = Math.max(...state.departments.map(dep => Calc.departmentQuantity(dep.id, state)), 1);
    $('#production-summary').innerHTML = state.departments.map(dep => { const qty = Calc.departmentQuantity(dep.id, state); return `<div class="production-row"><span>${esc(dep.name)}</span><strong>${fmt4(qty)}</strong><div class="mix-track"><i style="width:${qty / maxQty * 100}%"></i></div></div>`; }).join('');
  }

  function materialPath(material) {
    const parts = [`1 ${material.purchaseUnit}`];
    material.conversions.forEach(conversion => parts.push(`${fmt2(conversion.qty)} ${conversion.unit}`));
    return `<div class="conversion-path">${parts.map((part, index) => `${index ? '<b>→</b>' : ''}<span>${esc(part)}</span>`).join('')}</div>`;
  }

  function renderMaterials() {
    const categories = [...new Set(state.materials.map(item => item.category))].sort();
    const categorySelect = $('#material-category');
    const prior = categorySelect.value || 'all';
    categorySelect.innerHTML = `<option value="all">All categories</option>${categories.map(item => `<option ${item === prior ? 'selected' : ''}>${esc(item)}</option>`).join('')}`;
    $('#category-list').innerHTML = categories.map(item => `<option value="${esc(item)}"></option>`).join('');
    const search = $('#material-search').value.trim().toLowerCase();
    const filtered = state.materials.filter(item => (prior === 'all' || item.category === prior) && `${item.name} ${item.category} ${item.supplier}`.toLowerCase().includes(search));
    $('#material-count').textContent = `${filtered.length} material${filtered.length === 1 ? '' : 's'}`;
    $('#materials-table').innerHTML = filtered.map(item => `<tr><td><div class="meal-cell"><span class="meal-thumb">${materialEmoji(item.category)}</span><div><strong>${esc(item.name)}</strong><span>${esc(item.category)} · ${esc(item.supplier || 'No supplier')}</span></div></div></td><td>1 ${esc(item.purchaseUnit)}<br><small>${fmt4(Calc.unitsPerPurchase(item))} ${esc(Calc.baseUnit(item))}</small></td><td>${materialPath(item)}</td><td class="money">${money(item.purchasePrice)}</td><td>${fmt4(item.yieldPct)}%</td><td class="money positive">${money(Calc.materialUnitCost(item))} / ${esc(Calc.baseUnit(item))}</td><td><div class="action-menu">${permission().canEditMaterials ? `<button class="icon-action" data-action="edit-material" data-id="${item.id}" title="Edit">✎</button><button class="icon-action delete" data-action="delete-material" data-id="${item.id}" title="Delete">×</button>` : ''}</div></td></tr>`).join('') || `<tr><td colspan="7" class="empty-state">No materials match this filter.</td></tr>`;
  }

  function renderMeals() {
    const departmentSelect = $('#meal-department');
    const priorDep = departmentSelect.value || 'all';
    departmentSelect.innerHTML = `<option value="all">All departments</option>${state.departments.map(dep => `<option value="${dep.id}" ${dep.id === priorDep ? 'selected' : ''}>${esc(dep.name)}</option>`).join('')}`;
    const search = $('#meal-search').value.trim().toLowerCase();
    const resultFilter = $('#meal-status').value;
    const filtered = state.meals.filter(meal => {
      const cost = Calc.mealCost(meal, state);
      const pending = !(meal.ingredients || []).length;
      const resultMatches = resultFilter === 'all' || (resultFilter === 'pending' ? pending : resultFilter === 'profit' ? !pending && cost.profit >= 0 : !pending && cost.profit < 0);
      return (priorDep === 'all' || meal.departmentId === priorDep) && `${meal.name} ${meal.code} ${meal.menuSection || ''}`.toLowerCase().includes(search) && resultMatches;
    });
    $('#meal-count').textContent = `${filtered.length} meal${filtered.length === 1 ? '' : 's'}`;
    $('#meal-grid').innerHTML = filtered.map(meal => {
      const cost = Calc.mealCost(meal, state); const total = cost.total || 1; const pending = !(meal.ingredients || []).length;
      const costBody = pending ? `<div class="cost-total"><div><span>COST STATUS</span><strong>Recipe pending</strong></div><div class="margin-box"><span>MENU PRICE</span><strong>${money(cost.price)}</strong></div></div><div class="pending-recipe-note">Add ingredients and production quantity to calculate the full meal cost.</div>` : `<div class="cost-total"><div><span>FULL COST / MEAL</span><strong>${money(cost.total)}</strong></div><div class="margin-box"><span>PROFIT MARGIN</span><strong class="${cost.profit >= 0 ? 'positive' : 'negative'}">${pct(cost.margin)}</strong></div></div><div class="cost-stack"><i style="width:${cost.material / total * 100}%"></i><i style="width:${cost.labour / total * 100}%"></i><i style="width:${cost.expenses / total * 100}%"></i></div><div class="cost-legend"><span>Materials<b>${money(cost.material)}</b></span><span>Labour<b>${money(cost.labour)}</b></span><span>Expenses<b>${money(cost.expenses)}</b></span></div>`;
      return `<article class="meal-card"><div class="meal-card-top"><span class="meal-thumb">${mealEmoji(meal)}</span><div class="meal-card-title"><h3>${esc(meal.name)}</h3><span>${esc(meal.code)} · ${esc(meal.menuSection || department(meal.departmentId)?.name || 'Unassigned')}</span></div><span class="status ${pending ? 'warning' : cost.profit < 0 ? 'loss' : cost.margin < 20 ? 'warning' : 'good'}">${pending ? 'Recipe pending' : cost.profit < 0 ? 'Loss' : 'Profit'}</span></div>${costBody}<div class="meal-card-actions"><button class="text-btn" data-action="view-meal" data-id="${meal.id}">View cost card →</button>${permission().canEditCosts ? `<div class="action-menu"><button class="icon-action" data-action="edit-meal" data-id="${meal.id}">✎</button><button class="icon-action delete" data-action="delete-meal" data-id="${meal.id}">×</button></div>` : ''}</div></article>`;
    }).join('') || `<div class="permission-message"><h2>No meals found</h2><p>Adjust the filters or add a new meal recipe.</p></div>`;
  }

  function renderWorkforce() {
    const annual = state.employees.reduce((sum, item) => sum + Calc.annualEmployeeCost(item), 0);
    const direct = state.employees.filter(item => item.costType === 'direct').reduce((sum, item) => sum + Calc.annualEmployeeCost(item), 0);
    $('#workforce-stats').innerHTML = statCard('Annual employment cost', money(annual), 'Before allocation percentages') + statCard('Direct labour', money(direct), `${pct(annual ? direct / annual * 100 : 0)} of total`) + statCard('Indirect labour', money(annual - direct), 'Supervision and support') + statCard('Cost pools', fmt4(state.employees.length), `${state.departments.length} departments`);
    $('#employees-table').innerHTML = state.employees.map(item => { const basis = Calc.departmentQuantity(item.departmentId, state); return `<tr><td><strong>${esc(item.name)}</strong></td><td>${esc(department(item.departmentId)?.name || 'Unassigned')}</td><td><span class="status ${item.costType === 'direct' ? 'good' : 'warning'}">${item.costType === 'direct' ? 'Direct' : 'Indirect'}</span></td><td class="money">${money(item.monthlySalary)}</td><td class="money">${money(item.leaveProvision)}</td><td class="money">${money(item.eosProvision)}</td><td class="money">${money(Calc.annualEmployeeCost(item))}</td><td>${fmt4(item.allocationPct)}%<br><small>${money(Calc.employeeUnitCost(item, state))} / unit over ${fmt4(basis)}</small></td><td><div class="action-menu">${permission().canEditCosts ? `<button class="icon-action" data-action="edit-employee" data-id="${item.id}">✎</button><button class="icon-action delete" data-action="delete-employee" data-id="${item.id}">×</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="9" class="empty-state">No employee costs added.</td></tr>`;
  }

  function expenseFormula(item, context = state) {
    if (item.method === 'manual_unit') return `Manual ${money(item.manualUnit)} / selected meal`;
    const basis = Calc.expenseBasis(item, context);
    return `${fmt4(item.annualAmount)} × ${fmt4(item.allocationPct)}% ÷ ${fmt4(basis)} = ${fmt4(Calc.expenseUnitCost(item, context))}`;
  }

  function renderExpenses() {
    const annual = state.expenses.reduce((sum, item) => sum + num(item.annualAmount), 0);
    const fixed = state.expenses.filter(item => item.costClass === 'Fixed').reduce((sum, item) => sum + num(item.annualAmount), 0);
    $('#expense-stats').innerHTML = statCard('Annual expense pool', money(annual), 'Before allocation percentages') + statCard('Fixed costs', money(fixed), `${pct(annual ? fixed / annual * 100 : 0)} of annual pool`) + statCard('Variable & other', money(annual - fixed), 'Direct and indirect costs') + statCard('Expense accounts', fmt4(state.expenses.length), 'Available for meal selection');
    $('#expenses-table').innerHTML = state.expenses.map(item => { const unit = Calc.expenseUnitCost(item, state); return `<tr><td><strong>${esc(item.name)}</strong><br><small>${esc(item.notes || '')}</small></td><td><span class="status ${item.costClass === 'Fixed' ? 'warning' : 'good'}">${esc(item.costClass)}</span></td><td>${item.scope === 'department' ? esc(department(item.departmentId)?.name || 'Missing department') : 'All departments'}</td><td class="money">${money(item.annualAmount)}</td><td>${item.method === 'manual_unit' ? 'Manual unit' : 'Production quantity'}</td><td>${fmt4(item.allocationPct)}%<br><small>Basis: ${fmt4(Calc.expenseBasis(item, state))}</small></td><td class="money positive">${money(unit)}<br><small>${esc(expenseFormula(item))}</small></td><td><div class="action-menu">${permission().canEditCosts ? `<button class="icon-action" data-action="edit-expense" data-id="${item.id}">✎</button><button class="icon-action delete" data-action="delete-expense" data-id="${item.id}">×</button>` : ''}</div></td></tr>`; }).join('') || `<tr><td colspan="8" class="empty-state">No operating expenses added.</td></tr>`;
  }

  function renderUsers() {
    $('#role-grid').innerHTML = Object.entries(roles).map(([id, role], index) => `<article class="role-card"><i>${['♢','◎','◇','◉'][index]}</i><strong>${esc(role.name)}</strong><span>${state.users.filter(user => user.role === id).length} user(s)</span><p>${esc(role.description)}</p></article>`).join('');
    $('#users-table').innerHTML = state.users.map(user => `<tr><td><div class="meal-cell"><span class="avatar">${initials(user.name)}</span><div><strong>${esc(user.name)}</strong><span>${esc(user.email)}</span></div></div></td><td><b>${esc(roles[user.role]?.name || user.role)}</b></td><td>${esc(roles[user.role]?.access || 'Custom')}</td><td><span class="status ${user.status.toLowerCase()}">${esc(user.status)}</span></td><td><div class="action-menu"><button class="icon-action" data-action="edit-user" data-id="${user.id}">✎</button>${user.id !== state.currentUserId ? `<button class="icon-action delete" data-action="delete-user" data-id="${user.id}">×</button>` : ''}</div></td></tr>`).join('');
  }

  function renderSettings() {
    const form = $('#settings-form');
    Object.entries(state.settings).forEach(([key, value]) => { if (form.elements[key]) form.elements[key].value = value; });
    $('#department-list').innerHTML = state.departments.map(item => `<span class="department-chip">${esc(item.name)}${state.meals.some(meal => meal.departmentId === item.id) || state.employees.some(employee => employee.departmentId === item.id) ? '' : `<button data-action="delete-department" data-id="${item.id}">×</button>`}</span>`).join('');
  }

  function mealEmoji(meal) { const dep = department(meal.departmentId)?.name.toLowerCase() || ''; return dep.includes('grill') ? '♨' : dep.includes('beverage') ? '◌' : dep.includes('bakery') ? '◒' : '♧'; }
  function materialEmoji(category) { const value = String(category).toLowerCase(); return value.includes('meat') ? '◈' : value.includes('egg') ? '◉' : value.includes('frozen') ? '❄' : value.includes('pack') ? '□' : value.includes('oil') ? '◐' : '◇'; }

  function openModal(id) { const modal = $(`#${id}`); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; setTimeout(() => $('input:not([type="hidden"]), select', modal)?.focus(), 50); }
  function closeModal(modal) { const target = typeof modal === 'string' ? $(`#${modal}`) : modal.closest('.modal'); if (!target) return; target.classList.remove('open'); target.setAttribute('aria-hidden', 'true'); if (!$('.modal.open')) document.body.style.overflow = ''; }

  function addConversionRow(value = { qty: '', unit: '' }) {
    const row = document.createElement('div'); row.className = 'conversion-row';
    row.innerHTML = `<span>contains</span><input class="conversion-qty" type="number" min="0.0001" step="0.0001" value="${esc(value.qty)}" placeholder="Quantity" required><span>of</span><input class="conversion-unit" value="${esc(value.unit)}" placeholder="Unit name" required><button class="remove-conversion" type="button">×</button>`;
    $('#conversion-rows').appendChild(row); updateConversionPreview();
  }

  function updateConversionPreview() {
    const form = $('#material-form'); const price = num(form.elements.purchasePrice.value); const purchase = form.elements.purchaseUnit.value || 'purchase package'; const yieldPct = num(form.elements.yieldPct.value) || 100;
    const rows = $$('.conversion-row', form).map(row => ({ qty: num($('.conversion-qty', row).value), unit: $('.conversion-unit', row).value || 'unit' }));
    const total = rows.reduce((sum, row) => sum * (row.qty || 1), 1); const base = rows.at(-1)?.unit || purchase; const unitCost = total ? price / (total * yieldPct / 100) : 0;
    $('#conversion-preview').innerHTML = `<strong>1 ${esc(purchase)} = ${fmt4(total)} ${esc(base)}</strong><br>${money(price)} ÷ (${fmt4(total)} × ${fmt4(yieldPct)}% yield) = <b>${money(unitCost)} per ${esc(base)}</b>`;
  }

  function openMaterial(item = null) {
    const form = $('#material-form'); form.reset(); form.elements.id.value = item?.id || ''; form.elements.yieldPct.value = item?.yieldPct ?? 100;
    ['name','category','supplier','purchasePrice','purchaseUnit','notes'].forEach(key => form.elements[key].value = item?.[key] ?? '');
    $('#material-modal-title').textContent = item ? 'Edit material' : 'Add material'; $('#conversion-rows').innerHTML = '';
    (item?.conversions?.length ? item.conversions : [{ qty: '', unit: '' }]).forEach(addConversionRow); updateConversionPreview(); openModal('material-modal');
  }

  function populateDepartmentSelects(root, selected = '') { $$('select[name="departmentId"]', root).forEach(select => setOptions(select, state.departments, selected, 'Choose department')); }

  function addRecipeLine(line = {}) {
    const row = document.createElement('div'); row.className = 'recipe-line';
    row.innerHTML = `<select class="line-material" required><option value="">Choose material...</option>${state.materials.map(item => `<option value="${item.id}" ${item.id === line.materialId ? 'selected' : ''}>${esc(item.name)} · ${money(Calc.materialUnitCost(item))}/${esc(Calc.baseUnit(item))}</option>`).join('')}</select><input class="line-qty" type="number" min="0" step="0.0001" value="${esc(line.qty ?? '')}" placeholder="0.0000" required><select class="line-unit"></select><input class="line-waste" type="number" min="0" step="0.01" value="${esc(line.wastePct ?? 0)}"><b class="recipe-line-cost">${money(0)}</b><button type="button" class="remove-recipe-line">×</button>`;
    $('#recipe-lines').appendChild(row); updateLineUnits(row, line.unit); updateMealPreview();
  }

  function updateLineUnits(row, selected = '') {
    const material = state.materials.find(item => item.id === $('.line-material', row).value); const options = material ? Calc.compatibleUnits(material) : [];
    $('.line-unit', row).innerHTML = options.map(unit => `<option ${String(unit).toLowerCase() === String(selected).toLowerCase() ? 'selected' : ''}>${esc(unit)}</option>`).join('');
  }

  function mealDraft() {
    const form = $('#meal-form');
    const id = form.elements.id.value || uid('meal');
    const existing = state.meals.find(item => item.id === id) || {};
    const ingredients = $$('.recipe-line', form).map(row => ({ materialId: $('.line-material', row).value, qty: num($('.line-qty', row).value), unit: $('.line-unit', row).value, wastePct: num($('.line-waste', row).value) })).filter(line => line.materialId);
    return { ...existing, id, name: form.elements.name.value || 'New meal', code: form.elements.code.value || '', departmentId: form.elements.departmentId.value, branch: form.elements.branch.value, annualQty: num(form.elements.annualQty.value), sellingPrice: num(form.elements.sellingPrice.value), ingredients, employeeIds: $$('input[name="employeeIds"]:checked', form).map(input => input.value), expenseIds: $$('input[name="expenseIds"]:checked', form).map(input => input.value), costingStatus: ingredients.length ? 'costed' : 'recipe_pending' };
  }

  function previewState(draft) { const copy = { ...state, meals: state.meals.filter(item => item.id !== draft.id).concat(draft) }; return copy; }

  function updateMealPreview() {
    const form = $('#meal-form'); if (!form.closest('.modal').classList.contains('open') && !form.elements.name.value) return;
    const draft = mealDraft(); const calcState = previewState(draft); const cost = Calc.mealCost(draft, calcState);
    $$('.recipe-line', form).forEach(row => { const line = { materialId: $('.line-material', row).value, qty: num($('.line-qty', row).value), unit: $('.line-unit', row).value, wastePct: num($('.line-waste', row).value) }; $('.recipe-line-cost', row).textContent = money(Calc.ingredientCost(line, calcState)); });
    $('#meal-cost-preview').innerHTML = `<h3>Live unit cost</h3><div class="preview-row"><span>Recipe materials</span><strong>${money(cost.material)}</strong></div><div class="preview-row"><span>Selected labour</span><strong>${money(cost.labour)}</strong></div><div class="preview-row"><span>Selected expenses</span><strong>${money(cost.expenses)}</strong></div><div class="preview-total"><span>FULL COST PER MEAL</span><strong>${money(cost.total)}</strong></div><div class="preview-profit"><div><span>PROFIT / LOSS</span><strong class="${cost.profit >= 0 ? 'positive' : 'negative'}">${money(cost.profit)}</strong></div><div><span>MARGIN</span><strong>${pct(cost.margin)}</strong></div><div><span>PRICE BEFORE VAT</span><strong>${money(cost.price)}</strong></div><div><span>PRICE WITH VAT</span><strong>${money(cost.price * (1 + num(state.settings.vatRate) / 100))}</strong></div></div>`;
  }

  function renderMealSelections(meal) {
    const depId = $('#meal-form').elements.departmentId.value;
    $('#meal-employees').innerHTML = state.employees.map(item => { const selected = meal.employeeIds?.includes(item.id); const basis = Calc.departmentQuantity(item.departmentId, previewState(mealDraft())); const related = item.departmentId === depId; return `<label class="selection-row"><input type="checkbox" name="employeeIds" value="${item.id}" ${selected ? 'checked' : ''}><span><strong>${esc(item.name)}${related ? '' : ' · Other department'}</strong><span>${esc(department(item.departmentId)?.name || '')} · ${money(Calc.annualEmployeeCost(item))} annual ÷ ${fmt4(basis)} units</span></span><b>${money(Calc.employeeUnitCost(item, previewState(mealDraft())))}</b></label>`; }).join('') || `<div class="empty-state">Add employee costs first.</div>`;
    $('#meal-expenses').innerHTML = state.expenses.map(item => { const selected = meal.expenseIds?.includes(item.id); const wrongDep = item.scope === 'department' && item.departmentId !== depId; const context = previewState(mealDraft()); return `<label class="selection-row"><input type="checkbox" name="expenseIds" value="${item.id}" ${selected ? 'checked' : ''} ${wrongDep ? 'disabled' : ''}><span><strong>${esc(item.name)}${wrongDep ? ' · Different department' : ''}</strong><span>${esc(expenseFormula(item, context))}</span></span><b>${money(Calc.expenseUnitCost(item, context))}</b></label>`; }).join('') || `<div class="empty-state">Add operating expenses first.</div>`;
  }

  function openMeal(meal = null) {
    const form = $('#meal-form'); form.reset(); $('#meal-modal-title').textContent = meal ? `Edit ${meal.name}` : 'Build meal cost';
    populateDepartmentSelects(form, meal?.departmentId || state.departments[0]?.id); form.elements.id.value = meal?.id || '';
    ['name','code','branch','annualQty','sellingPrice'].forEach(key => form.elements[key].value = meal?.[key] ?? (key === 'branch' ? 'All Branches' : ''));
    $('#recipe-lines').innerHTML = ''; $('#meal-employees').innerHTML = ''; $('#meal-expenses').innerHTML = ''; (meal?.ingredients?.length ? meal.ingredients : [{}]).forEach(addRecipeLine);
    openModal('meal-modal'); renderMealSelections(meal || mealDraft()); updateMealPreview();
  }

  function openEmployee(item = null) {
    const form = $('#employee-form'); form.reset(); populateDepartmentSelects(form, item?.departmentId || state.departments[0]?.id); $('#employee-modal-title').textContent = item ? 'Edit employee cost' : 'Add employee cost';
    const defaults = { id: '', name: '', costType: 'direct', monthlySalary: 0, monthlyAllowances: 0, leaveProvision: 0, eosProvision: 0, otherAnnual: 0, allocationPct: 100 };
    Object.keys(defaults).forEach(key => form.elements[key].value = item?.[key] ?? defaults[key]); openModal('employee-modal');
  }

  function openExpense(item = null) {
    const form = $('#expense-form'); form.reset(); populateDepartmentSelects(form, item?.departmentId || ''); $('#expense-modal-title').textContent = item ? 'Edit expense' : 'Add expense';
    const defaults = { id: '', name: '', costClass: 'Fixed', annualAmount: 0, allocationPct: 100, scope: 'all', method: 'production_qty', manualUnit: 0, notes: '' };
    Object.keys(defaults).forEach(key => form.elements[key].value = item?.[key] ?? defaults[key]); toggleExpenseFields(); openModal('expense-modal');
  }

  function toggleExpenseFields() { const form = $('#expense-form'); form.elements.departmentId.disabled = form.elements.scope.value !== 'department'; form.elements.manualUnit.disabled = form.elements.method.value !== 'manual_unit'; form.elements.annualAmount.disabled = false; }

  function openUser(item = null) { const form = $('#user-form'); form.reset(); $('#user-modal-title').textContent = item ? 'Edit user' : 'Add user'; ['id','name','email','role','status'].forEach(key => form.elements[key].value = item?.[key] ?? (key === 'role' ? 'manager' : key === 'status' ? 'Active' : '')); openModal('user-modal'); }

  function showMealDrawer(id) {
    const meal = state.meals.find(item => item.id === id); if (!meal) return; const cost = Calc.mealCost(meal, state);
    const ingredientRows = meal.ingredients.map(line => { const material = state.materials.find(item => item.id === line.materialId); return `<div class="detail-line"><div><strong>${esc(material?.name || 'Missing material')}</strong><span>${fmt4(line.qty)} ${esc(line.unit)} · waste ${fmt4(line.wastePct)}%</span></div><small>${money(Calc.ingredientCost(line, state))}</small></div>`; }).join('');
    const employeeRows = meal.employeeIds.map(id => state.employees.find(item => item.id === id)).filter(Boolean).map(item => `<div class="detail-line"><div><strong>${esc(item.name)}</strong><span>${money(Calc.annualEmployeeCost(item))} × ${fmt4(item.allocationPct)}% ÷ ${fmt4(Calc.departmentQuantity(item.departmentId, state))}</span></div><small>${money(Calc.employeeUnitCost(item, state))}</small></div>`).join('');
    const expenseRows = meal.expenseIds.map(id => state.expenses.find(item => item.id === id)).filter(Boolean).map(item => `<div class="detail-line"><div><strong>${esc(item.name)}</strong><span>Annual amount: ${money(item.annualAmount)} · allocation ${fmt4(item.allocationPct)}%</span><div class="formula-box">${esc(expenseFormula(item))}</div></div><small>${money(Calc.expenseUnitCost(item, state))}</small></div>`).join('');
    const pending = !(meal.ingredients || []).length;
    const sourceDetail = meal.menuSection ? `${meal.menuSection} · Menu page ${meal.menuPage}` : department(meal.departmentId)?.name || '';
    $('#drawer-content').innerHTML = `<div class="drawer-hero"><span class="eyebrow">${esc(meal.code)} · ${esc(meal.branch)}</span><h2>${esc(meal.name)}</h2><p>${esc(sourceDetail)} · ${fmt4(meal.annualQty)} annual production units</p></div>${pending ? '<div class="pending-recipe-note"><b>Recipe pending.</b> Add ingredients and production quantity before using profit figures.</div>' : ''}<div class="drawer-kpis"><div class="drawer-kpi"><span>SELLING PRICE</span><strong>${money(cost.price)}</strong></div><div class="drawer-kpi"><span>FULL UNIT COST</span><strong>${pending ? 'Pending' : money(cost.total)}</strong></div><div class="drawer-kpi"><span>PROFIT / LOSS</span><strong class="${!pending && cost.profit >= 0 ? 'positive' : !pending ? 'negative' : ''}">${pending ? 'Pending' : money(cost.profit)}</strong></div></div><section class="drawer-section"><h3>Recipe materials · ${money(cost.material)}</h3>${ingredientRows || '<div class="empty-state">No materials selected.</div>'}</section><section class="drawer-section"><h3>Selected labour · ${money(cost.labour)}</h3>${employeeRows || '<div class="empty-state">No labour selected.</div>'}</section><section class="drawer-section"><h3>Selected operating expenses · ${money(cost.expenses)}</h3>${expenseRows || '<div class="empty-state">No expenses selected.</div>'}</section><div class="drawer-total"><span>${pending ? 'COSTING STATUS' : 'TOTAL COST PER ONE MEAL'}</span><strong>${pending ? 'Recipe pending' : money(cost.total)}</strong></div>`;
    $('#drawer-backdrop').classList.add('open'); $('#detail-drawer').classList.add('open');
  }

  function closeDrawer() { $('#drawer-backdrop').classList.remove('open'); $('#detail-drawer').classList.remove('open'); }

  function saveCollection(collection, item) { const index = state[collection].findIndex(existing => existing.id === item.id); if (index >= 0) state[collection][index] = item; else state[collection].push(item); }

  function handleAction(action, id) {
    if (action === 'add-material') return openMaterial(); if (action === 'edit-material') return openMaterial(state.materials.find(item => item.id === id));
    if (action === 'view-material') return openMaterial(state.materials.find(item => item.id === id)); if (action === 'add-meal') return openMeal(); if (action === 'edit-meal') return openMeal(state.meals.find(item => item.id === id)); if (action === 'view-meal') return showMealDrawer(id);
    if (action === 'add-employee') return openEmployee(); if (action === 'edit-employee') return openEmployee(state.employees.find(item => item.id === id)); if (action === 'add-expense') return openExpense(); if (action === 'edit-expense') return openExpense(state.expenses.find(item => item.id === id)); if (action === 'add-user') return openUser(); if (action === 'edit-user') return openUser(state.users.find(item => item.id === id));
    if (action.startsWith('delete-')) deleteRecord(action.replace('delete-', ''), id);
  }

  function deleteRecord(type, id) {
    const map = { material: 'materials', meal: 'meals', employee: 'employees', expense: 'expenses', user: 'users', department: 'departments' }; const collection = map[type]; if (!collection) return;
    if (type === 'material' && state.meals.some(meal => meal.ingredients.some(line => line.materialId === id))) return toast('Cannot delete', 'This material is used in a recipe.');
    if (type === 'employee' && state.meals.some(meal => meal.employeeIds.includes(id))) return toast('Cannot delete', 'This cost pool is selected in a meal.');
    if (type === 'expense' && state.meals.some(meal => meal.expenseIds.includes(id))) return toast('Cannot delete', 'This expense is selected in a meal.');
    if (!confirm('Delete this record? This cannot be undone.')) return;
    state[collection] = state[collection].filter(item => item.id !== id); persist('Record deleted'); renderAll();
  }

  function exportBackup() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `meal-costing-backup-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); toast('Backup created', 'The complete costing file was downloaded.');
  }

  document.addEventListener('click', event => {
    const nav = event.target.closest('[data-page]'); if (nav) navigate(nav.dataset.page);
    const pageLink = event.target.closest('[data-page-link]'); if (pageLink) navigate(pageLink.dataset.pageLink);
    const action = event.target.closest('[data-action]'); if (action) handleAction(action.dataset.action, action.dataset.id);
    if (event.target.closest('[data-close]')) closeModal(event.target);
    if (event.target.classList.contains('modal')) closeModal(event.target);
  });

  $('#main-nav').addEventListener('click', event => { const button = event.target.closest('.nav-item'); if (button) navigate(button.dataset.page); });
  $('#menu-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('open'));
  $('#quick-add').addEventListener('click', () => openMeal());
  $('#export-top').addEventListener('click', exportBackup); $('#export-backup').addEventListener('click', exportBackup);
  $('#user-switcher').addEventListener('click', () => { $('#switch-user-list').innerHTML = state.users.filter(user => user.status === 'Active').map(user => `<button class="switch-user-item" data-switch-user="${user.id}"><span class="avatar">${initials(user.name)}</span><span><strong>${esc(user.name)}</strong><small>${esc(roles[user.role]?.name)}</small></span>${user.id === state.currentUserId ? '<b>Current</b>' : '<b>Switch →</b>'}</button>`).join(''); openModal('user-switch-modal'); });
  $('#switch-user-list').addEventListener('click', event => { const button = event.target.closest('[data-switch-user]'); if (!button) return; state.currentUserId = button.dataset.switchUser; persist('Current user changed'); closeModal('user-switch-modal'); refreshPermissions(); navigate('dashboard'); });
  $('#drawer-close').addEventListener('click', closeDrawer); $('#drawer-backdrop').addEventListener('click', closeDrawer);

  ['material-search','meal-search'].forEach(id => $(`#${id}`).addEventListener('input', () => id.includes('material') ? renderMaterials() : renderMeals()));
  ['material-category'].forEach(id => $(`#${id}`).addEventListener('change', renderMaterials));
  ['meal-department','meal-status'].forEach(id => $(`#${id}`).addEventListener('change', renderMeals));
  $('#global-search').addEventListener('input', event => { const query = event.target.value; $('#meal-search').value = query; if (query.length >= 2) { navigate('meals'); renderMeals(); } });

  $('#add-conversion').addEventListener('click', () => addConversionRow());
  $('#conversion-rows').addEventListener('click', event => { if (event.target.classList.contains('remove-conversion') && $$('.conversion-row').length > 1) { event.target.closest('.conversion-row').remove(); updateConversionPreview(); } });
  $('#material-form').addEventListener('input', updateConversionPreview);
  $('#material-form').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; const conversions = $$('.conversion-row', form).map(row => ({ qty: num($('.conversion-qty', row).value), unit: $('.conversion-unit', row).value.trim() })).filter(item => item.qty && item.unit); if (!conversions.length) return toast('Conversion required', 'Add at least one package conversion.'); const item = { id: form.elements.id.value || uid('mat'), name: form.elements.name.value.trim(), category: form.elements.category.value.trim(), supplier: form.elements.supplier.value.trim(), purchasePrice: num(form.elements.purchasePrice.value), purchaseUnit: form.elements.purchaseUnit.value.trim(), yieldPct: num(form.elements.yieldPct.value), conversions, notes: form.elements.notes.value.trim() }; saveCollection('materials', item); persist('Material and unit cost saved'); closeModal('material-modal'); renderAll(); });

  $('#add-recipe-line').addEventListener('click', () => addRecipeLine());
  $('#recipe-lines').addEventListener('click', event => { if (event.target.classList.contains('remove-recipe-line') && $$('.recipe-line').length > 1) { event.target.closest('.recipe-line').remove(); updateMealPreview(); } });
  $('#recipe-lines').addEventListener('change', event => { if (event.target.classList.contains('line-material')) updateLineUnits(event.target.closest('.recipe-line')); updateMealPreview(); });
  $('#meal-form').addEventListener('input', event => { if (event.target.name === 'departmentId') renderMealSelections(mealDraft()); updateMealPreview(); });
  $('#meal-form').addEventListener('change', event => { if (event.target.name === 'departmentId') renderMealSelections(mealDraft()); updateMealPreview(); });
  $('#meal-form').addEventListener('submit', event => { event.preventDefault(); const meal = mealDraft(); if (!meal.ingredients.length) return toast('Recipe required', 'Add at least one raw material.'); saveCollection('meals', meal); persist('Recipe and full unit cost saved'); closeModal('meal-modal'); renderAll(); });

  $('#employee-form').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; const item = { id: form.elements.id.value || uid('emp'), name: form.elements.name.value.trim(), departmentId: form.elements.departmentId.value, costType: form.elements.costType.value, monthlySalary: num(form.elements.monthlySalary.value), monthlyAllowances: num(form.elements.monthlyAllowances.value), leaveProvision: num(form.elements.leaveProvision.value), eosProvision: num(form.elements.eosProvision.value), otherAnnual: num(form.elements.otherAnnual.value), allocationPct: num(form.elements.allocationPct.value) }; saveCollection('employees', item); persist('Employment cost saved'); closeModal('employee-modal'); renderAll(); });
  $('#expense-form').addEventListener('change', toggleExpenseFields);
  $('#expense-form').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; const item = { id: form.elements.id.value || uid('exp'), name: form.elements.name.value.trim(), costClass: form.elements.costClass.value, annualAmount: num(form.elements.annualAmount.value), allocationPct: num(form.elements.allocationPct.value), scope: form.elements.scope.value, departmentId: form.elements.scope.value === 'department' ? form.elements.departmentId.value : '', method: form.elements.method.value, manualUnit: num(form.elements.manualUnit.value), notes: form.elements.notes.value.trim() }; saveCollection('expenses', item); persist('Expense allocation saved'); closeModal('expense-modal'); renderAll(); });
  $('#user-form').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; const item = { id: form.elements.id.value || uid('usr'), name: form.elements.name.value.trim(), email: form.elements.email.value.trim(), role: form.elements.role.value, status: form.elements.status.value }; saveCollection('users', item); persist('User access saved'); closeModal('user-modal'); renderAll(); });
  $('#settings-form').addEventListener('submit', event => { event.preventDefault(); const form = event.currentTarget; state.settings = { businessName: form.elements.businessName.value.trim(), costingYear: num(form.elements.costingYear.value), vatRate: num(form.elements.vatRate.value), currency: form.elements.currency.value }; persist('Costing settings updated'); renderAll(); });
  $('#department-form').addEventListener('submit', event => { event.preventDefault(); const name = event.currentTarget.elements.name.value.trim(); if (!name) return; state.departments.push({ id: uid('dep'), name }); event.currentTarget.reset(); persist('Department added'); renderAll(); });
  $('#import-backup').addEventListener('change', event => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { try { const imported = JSON.parse(reader.result); if (!imported.version || !Array.isArray(imported.meals)) throw new Error(); state = imported; persist('Backup restored successfully'); renderAll(); } catch (_) { toast('Restore failed', 'Please choose a valid meal-costing backup file.'); } }; reader.readAsText(file); event.target.value = ''; });
  $('#reset-demo').addEventListener('click', () => { if (!confirm('Replace all current records with the original sample data?')) return; state = Data.sample(); persist('Sample records restored'); renderAll(); navigate('dashboard'); });

  renderAll();
})();
