(function () {
  const n = value => Number(value) || 0;
  const product = values => values.reduce((total, value) => total * n(value), 1);

  function baseUnit(material) {
    const conversions = material?.conversions || [];
    return conversions.length ? conversions[conversions.length - 1].unit : material?.purchaseUnit || 'Unit';
  }

  function unitsPerPurchase(material) {
    return product((material?.conversions || []).map(item => item.qty));
  }

  function materialUnitCost(material) {
    if (!material) return 0;
    const usableUnits = unitsPerPurchase(material) * (n(material.yieldPct) / 100 || 1);
    return usableUnits ? n(material.purchasePrice) / usableUnits : 0;
  }

  function compatibleUnits(material) {
    const base = baseUnit(material).toLowerCase();
    if (['kg', 'kilogram', 'kilograms'].includes(base)) return ['kg', 'g'];
    if (['l', 'litre', 'liter', 'litres', 'liters'].includes(base)) return ['L', 'ml'];
    return [baseUnit(material)];
  }

  function quantityInBase(qty, unit, material) {
    const base = baseUnit(material).toLowerCase();
    const source = String(unit || '').toLowerCase();
    if (['kg', 'kilogram', 'kilograms'].includes(base) && ['g', 'gram', 'grams'].includes(source)) return n(qty) / 1000;
    if (['l', 'litre', 'liter', 'litres', 'liters'].includes(base) && ['ml', 'millilitre', 'milliliter'].includes(source)) return n(qty) / 1000;
    return n(qty);
  }

  function ingredientCost(line, state) {
    const material = state.materials.find(item => item.id === line.materialId);
    const usableQty = quantityInBase(line.qty, line.unit, material);
    return usableQty * materialUnitCost(material) * (1 + n(line.wastePct) / 100);
  }

  function annualEmployeeCost(employee) {
    return (n(employee.monthlySalary) + n(employee.monthlyAllowances)) * 12 + n(employee.leaveProvision) + n(employee.eosProvision) + n(employee.otherAnnual);
  }

  function departmentQuantity(departmentId, state) {
    return state.meals.filter(meal => meal.departmentId === departmentId).reduce((sum, meal) => sum + n(meal.annualQty), 0);
  }

  function totalQuantity(state) {
    return state.meals.reduce((sum, meal) => sum + n(meal.annualQty), 0);
  }

  function employeeUnitCost(employee, state) {
    if (!employee) return 0;
    const basis = departmentQuantity(employee.departmentId, state);
    return basis ? annualEmployeeCost(employee) * n(employee.allocationPct) / 100 / basis : 0;
  }

  function expenseBasis(expense, state) {
    return expense.scope === 'department' ? departmentQuantity(expense.departmentId, state) : totalQuantity(state);
  }

  function expenseUnitCost(expense, state) {
    if (!expense) return 0;
    if (expense.method === 'manual_unit') return n(expense.manualUnit);
    const basis = expenseBasis(expense, state);
    return basis ? n(expense.annualAmount) * n(expense.allocationPct) / 100 / basis : 0;
  }

  function mealCost(meal, state) {
    const material = (meal.ingredients || []).reduce((sum, line) => sum + ingredientCost(line, state), 0);
    const labour = (meal.employeeIds || []).reduce((sum, id) => sum + employeeUnitCost(state.employees.find(item => item.id === id), state), 0);
    const expenses = (meal.expenseIds || []).reduce((sum, id) => sum + expenseUnitCost(state.expenses.find(item => item.id === id), state), 0);
    const total = material + labour + expenses;
    const price = n(meal.sellingPrice);
    const profit = price - total;
    return { material, labour, expenses, total, price, profit, margin: price ? profit / price * 100 : 0, foodCostPct: price ? material / price * 100 : 0 };
  }

  function conversionText(material) {
    let text = `1 ${material.purchaseUnit}`;
    (material.conversions || []).forEach(item => { text += ` × ${n(item.qty)} ${item.unit}`; });
    return text;
  }

  window.MealCostCalc = { n, baseUnit, unitsPerPurchase, materialUnitCost, compatibleUnits, quantityInBase, ingredientCost, annualEmployeeCost, departmentQuantity, totalQuantity, employeeUnitCost, expenseBasis, expenseUnitCost, mealCost, conversionText };
})();
