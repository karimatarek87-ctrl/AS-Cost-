(function () {
  const importedMaterials = Array.isArray(window.ImportedRawMaterials) ? window.ImportedRawMaterials : [];
  const importedMaterialsBatch = window.ImportedRawMaterialsBatch || `Item.xlsx-${importedMaterials.length}`;
  const importedMenuMeals = Array.isArray(window.ImportedMenuMeals) ? window.ImportedMenuMeals : [];
  const importedMenuBatch = window.ImportedMenuMealsBatch || `AS_MENU_2025.pdf-${importedMenuMeals.length}`;

  function mergeImportedMaterials(target) {
    target.materials = Array.isArray(target.materials) ? target.materials : [];
    if (target.materialImport?.batch === importedMaterialsBatch) return target;
    const existingIds = new Set(target.materials.map(item => item.id));
    importedMaterials.forEach(item => {
      if (!existingIds.has(item.id)) target.materials.push(JSON.parse(JSON.stringify(item)));
    });
    target.materialImport = {
      source: 'Item.xlsx',
      batch: importedMaterialsBatch,
      importedCount: importedMaterials.length,
      mergedAt: new Date().toISOString(),
    };
    return target;
  }

  function mergeImportedMeals(target) {
    target.meals = Array.isArray(target.meals) ? target.meals : [];
    if (target.menuImport?.batch === importedMenuBatch) return target;
    importedMenuMeals.forEach(item => {
      const existing = target.meals.find(current => current.id === item.id);
      if (!existing) {
        target.meals.push(JSON.parse(JSON.stringify(item)));
      } else if (!(existing.ingredients || []).length && (item.ingredients || []).length) {
        Object.assign(existing, JSON.parse(JSON.stringify(item)));
      }
    });
    // The confirmed menu recipe replaces the original demonstration duplicate.
    target.meals = target.meals.filter(item => item.id !== 'meal-shish-tawook');
    target.menuImport = {
      source: 'AS_MENU_2025.pdf',
      batch: importedMenuBatch,
      importedCount: importedMenuMeals.length,
      mergedAt: new Date().toISOString(),
    };
    return target;
  }

  const sampleData = {
    version: 1,
    settings: { businessName: 'Abu Shakra Restaurant & Cafe', costingYear: 2026, vatRate: 5, currency: 'AED' },
    currentUserId: 'usr-admin',
    departments: [
      { id: 'dep-grill', name: 'Grill Section' },
      { id: 'dep-kitchen', name: 'Main Kitchen' },
      { id: 'dep-bakery', name: 'Bakery' },
      { id: 'dep-beverage', name: 'Beverage' }
    ],
    materials: [
      { id: 'mat-egg', name: 'Fresh Eggs', category: 'Dairy & Eggs', supplier: 'Fresh Farm', purchasePrice: 180, purchaseUnit: 'Box', yieldPct: 100, conversions: [{ qty: 12, unit: 'Tray' }, { qty: 30, unit: 'Piece' }], notes: 'Medium eggs' },
      { id: 'mat-potato', name: 'French Fries', category: 'Frozen', supplier: 'Food Service Co.', purchasePrice: 82.5, purchaseUnit: 'Box', yieldPct: 100, conversions: [{ qty: 4, unit: 'Bag' }, { qty: 2.5, unit: 'kg' }], notes: '10 mm cut' },
      { id: 'mat-chicken', name: 'Boneless Chicken', category: 'Meat & Poultry', supplier: 'Prime Poultry', purchasePrice: 148, purchaseUnit: 'Carton', yieldPct: 92, conversions: [{ qty: 10, unit: 'kg' }], notes: 'Chilled breast and thigh mix' },
      { id: 'mat-lamb', name: 'Lamb Cubes', category: 'Meat & Poultry', supplier: 'Emirates Meat', purchasePrice: 310, purchaseUnit: 'Carton', yieldPct: 88, conversions: [{ qty: 10, unit: 'kg' }], notes: 'For kebab' },
      { id: 'mat-rice', name: 'Basmati Rice', category: 'Dry Goods', supplier: 'Golden Grain', purchasePrice: 155, purchaseUnit: 'Bag', yieldPct: 100, conversions: [{ qty: 20, unit: 'kg' }], notes: '' },
      { id: 'mat-oil', name: 'Sunflower Oil', category: 'Oils', supplier: 'Food Service Co.', purchasePrice: 98, purchaseUnit: 'Tin', yieldPct: 100, conversions: [{ qty: 20, unit: 'L' }], notes: '' },
      { id: 'mat-spice', name: 'Grill Spice Mix', category: 'Spices', supplier: 'House Blend', purchasePrice: 75, purchaseUnit: 'Bag', yieldPct: 100, conversions: [{ qty: 2.5, unit: 'kg' }], notes: '' },
      { id: 'mat-bread', name: 'Arabic Bread', category: 'Bakery', supplier: 'Central Bakery', purchasePrice: 52, purchaseUnit: 'Crate', yieldPct: 98, conversions: [{ qty: 100, unit: 'Piece' }], notes: '' },
      { id: 'mat-hummus', name: 'Hummus Portion', category: 'Accompaniments', supplier: 'Central Kitchen', purchasePrice: 90, purchaseUnit: 'Batch', yieldPct: 100, conversions: [{ qty: 30, unit: 'Portion' }], notes: '' },
      { id: 'mat-box', name: 'Meal Packaging Box', category: 'Packaging', supplier: 'Gulf Packaging', purchasePrice: 125, purchaseUnit: 'Carton', yieldPct: 100, conversions: [{ qty: 250, unit: 'Piece' }], notes: '' }
    ],
    employees: [
      { id: 'emp-grill-chef', name: 'Grill Chef Cost Pool', departmentId: 'dep-grill', costType: 'direct', monthlySalary: 5500, monthlyAllowances: 850, leaveProvision: 6350, eosProvision: 4100, otherAnnual: 2400, allocationPct: 100 },
      { id: 'emp-grill-helper', name: 'Grill Helpers Cost Pool', departmentId: 'dep-grill', costType: 'direct', monthlySalary: 8200, monthlyAllowances: 1600, leaveProvision: 9800, eosProvision: 5700, otherAnnual: 3600, allocationPct: 100 },
      { id: 'emp-kitchen', name: 'Main Kitchen Team', departmentId: 'dep-kitchen', costType: 'direct', monthlySalary: 14500, monthlyAllowances: 2800, leaveProvision: 17300, eosProvision: 9600, otherAnnual: 6200, allocationPct: 100 },
      { id: 'emp-supervision', name: 'Kitchen Supervision', departmentId: 'dep-kitchen', costType: 'indirect', monthlySalary: 8500, monthlyAllowances: 1200, leaveProvision: 9700, eosProvision: 5800, otherAnnual: 3000, allocationPct: 65 }
    ],
    expenses: [
      { id: 'exp-rent', name: 'Restaurant Deira Rent - 2026', costClass: 'Fixed', annualAmount: 441000, allocationPct: 100, scope: 'all', departmentId: '', method: 'production_qty', manualUnit: 0, notes: 'Allocated over all meal production.' },
      { id: 'exp-gas', name: 'Grill Gas & Charcoal - 2026', costClass: 'Variable', annualAmount: 78000, allocationPct: 100, scope: 'department', departmentId: 'dep-grill', method: 'production_qty', manualUnit: 0, notes: 'Grill production only.' },
      { id: 'exp-utilities', name: 'Kitchen Utilities - 2026', costClass: 'Indirect', annualAmount: 96000, allocationPct: 75, scope: 'all', departmentId: '', method: 'production_qty', manualUnit: 0, notes: '' },
      { id: 'exp-delivery', name: 'Delivery Packaging Support', costClass: 'Variable', annualAmount: 0, allocationPct: 100, scope: 'all', departmentId: '', method: 'manual_unit', manualUnit: 0.65, notes: 'Manual amount per selected meal.' }
    ],
    meals: [
      { id: 'meal-mixed-grill', name: 'Mixed Grill', code: 'GR-001', departmentId: 'dep-grill', branch: 'Deira', annualQty: 72000, sellingPrice: 54, ingredients: [{ materialId: 'mat-chicken', qty: 180, unit: 'g', wastePct: 2 }, { materialId: 'mat-lamb', qty: 140, unit: 'g', wastePct: 2 }, { materialId: 'mat-spice', qty: 12, unit: 'g', wastePct: 0 }, { materialId: 'mat-bread', qty: 1, unit: 'Piece', wastePct: 0 }, { materialId: 'mat-hummus', qty: 1, unit: 'Portion', wastePct: 0 }, { materialId: 'mat-box', qty: 1, unit: 'Piece', wastePct: 0 }], employeeIds: ['emp-grill-chef','emp-grill-helper'], expenseIds: ['exp-rent','exp-gas','exp-utilities'] },
      { id: 'meal-shish-tawook', name: 'Shish Tawook Plate', code: 'GR-002', departmentId: 'dep-grill', branch: 'Deira', annualQty: 86500, sellingPrice: 38, ingredients: [{ materialId: 'mat-chicken', qty: 280, unit: 'g', wastePct: 3 }, { materialId: 'mat-spice', qty: 14, unit: 'g', wastePct: 0 }, { materialId: 'mat-bread', qty: 1, unit: 'Piece', wastePct: 0 }, { materialId: 'mat-hummus', qty: 1, unit: 'Portion', wastePct: 0 }, { materialId: 'mat-box', qty: 1, unit: 'Piece', wastePct: 0 }], employeeIds: ['emp-grill-chef','emp-grill-helper'], expenseIds: ['exp-rent','exp-gas','exp-utilities'] },
      { id: 'meal-chicken-rice', name: 'Chicken & Rice', code: 'KT-001', departmentId: 'dep-kitchen', branch: 'Deira', annualQty: 64000, sellingPrice: 32, ingredients: [{ materialId: 'mat-chicken', qty: 240, unit: 'g', wastePct: 2 }, { materialId: 'mat-rice', qty: 120, unit: 'g', wastePct: 1 }, { materialId: 'mat-oil', qty: 18, unit: 'ml', wastePct: 0 }, { materialId: 'mat-spice', qty: 8, unit: 'g', wastePct: 0 }, { materialId: 'mat-box', qty: 1, unit: 'Piece', wastePct: 0 }], employeeIds: ['emp-kitchen','emp-supervision'], expenseIds: ['exp-rent','exp-utilities','exp-delivery'] },
      { id: 'meal-egg-breakfast', name: 'Egg Breakfast', code: 'KT-002', departmentId: 'dep-kitchen', branch: 'Deira', annualQty: 42500, sellingPrice: 24, ingredients: [{ materialId: 'mat-egg', qty: 3, unit: 'Piece', wastePct: 1 }, { materialId: 'mat-oil', qty: 10, unit: 'ml', wastePct: 0 }, { materialId: 'mat-bread', qty: 2, unit: 'Piece', wastePct: 0 }, { materialId: 'mat-hummus', qty: 1, unit: 'Portion', wastePct: 0 }], employeeIds: ['emp-kitchen','emp-supervision'], expenseIds: ['exp-rent','exp-utilities'] }
    ],
    users: [
      { id: 'usr-admin', name: 'Mohamed Adel', email: 'mohamed@abushakra.ae', role: 'administrator', status: 'Active' },
      { id: 'usr-cost', name: 'Sara Hassan', email: 'sara@abushakra.ae', role: 'cost_controller', status: 'Active' },
      { id: 'usr-buy', name: 'Omar Ali', email: 'omar@abushakra.ae', role: 'purchasing', status: 'Active' },
      { id: 'usr-view', name: 'Branch Management', email: 'management@abushakra.ae', role: 'manager', status: 'Active' }
    ]
  };

  window.MealCostData = {
    storageKey: 'abu-shakra-meal-costing-v1',
    sample() { return mergeImportedMeals(mergeImportedMaterials(JSON.parse(JSON.stringify(sampleData)))); },
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(this.storageKey));
        const result = saved && saved.version === 1 ? mergeImportedMeals(mergeImportedMaterials(saved)) : this.sample();
        this.save(result);
        return result;
      } catch (_) { return this.sample(); }
    },
    save(state) { localStorage.setItem(this.storageKey, JSON.stringify(state)); }
  };
})();
