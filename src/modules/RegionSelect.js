// src/modules/RegionSelect.js
// 你后端明确表示暂时不做 region 树接口，所以这里直接用写死的张家口数据
export function RegionSelect(onChangeCallback) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    const createSelect = (placeholder, disabled = false) => {
        const sel = document.createElement('select');
        sel.className = 'region-select';
        sel.style.cssText = 'padding: 8px 12px; border: 1px solid #d1ded7; border-radius: 6px; outline: none; min-width: 130px; background: #fff; color: #333; font-size: 14px;';
        sel.innerHTML = `<option value="">${placeholder}</option>`;
        sel.disabled = disabled;
        return sel;
    };

    const provinceSelect = createSelect('-- 选择省份 --');
    const citySelect = createSelect('-- 选择城市 --', true);
    const districtSelect = createSelect('-- 选择区县 --', true);

    container.appendChild(provinceSelect);
    container.appendChild(citySelect);
    container.appendChild(districtSelect);

    // 写死张家口（等后端给了真实数据再替换）
    const regionTree = [
      {
        label: "河北省", value: "130000",
        children: [
          {
            label: "张家口市", value: "130700",
            children: [
              { label: "桥东区", value: "130702" }, { label: "桥西区", value: "130703" },
              { label: "宣化区", value: "130705" }, { label: "下花园区", value: "130706" },
              { label: "万全区", value: "130707" }, { label: "崇礼区", value: "130709" },
              { label: "张北县", value: "130722" }, { label: "康保县", value: "130723" },
              { label: "沽源县", value: "130724" }, { label: "尚义县", value: "130725" },
              { label: "蔚县", value: "130726" }, { label: "阳原县", value: "130727" },
              { label: "怀安县", value: "130728" }, { label: "怀来县", value: "130730" },
              { label: "涿鹿县", value: "130731" }, { label: "赤城县", value: "130732" }
            ]
          }
        ]
      },
      { label: "山西省", value: "140000", children: [] },
      { label: "北京市", value: "110000", children: [] }
    ];

    regionTree.forEach(prov => {
        const opt = document.createElement('option');
        opt.value = prov.value; opt.textContent = prov.label;
        provinceSelect.appendChild(opt);
    });

    provinceSelect.addEventListener('change', (e) => {
        const provId = e.target.value;
        citySelect.innerHTML = '<option value="">-- 选择城市 --</option>';
        districtSelect.innerHTML = '<option value="">-- 选择区县 --</option>';
        districtSelect.disabled = true;

        if (!provId) { citySelect.disabled = true; triggerChange(); return; }
        citySelect.disabled = false;
        const prov = regionTree.find(p => p.value == provId);
        if (prov.children.length === 0) {
            citySelect.innerHTML = '<option value="" disabled>暂无该省城市数据</option>';
        } else {
            prov.children.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city.value; opt.textContent = city.label;
                citySelect.appendChild(opt);
            });
        }
        triggerChange();
    });

    citySelect.addEventListener('change', (e) => {
        const cityId = e.target.value;
        districtSelect.innerHTML = '<option value="">-- 选择区县 --</option>';
        if (!cityId) { districtSelect.disabled = true; triggerChange(); return; }
        districtSelect.disabled = false;
        const prov = regionTree.find(p => p.value == provinceSelect.value);
        const city = prov.children.find(c => c.value == cityId);
        if (city.children.length === 0) {
            districtSelect.innerHTML = '<option value="" disabled>暂无该市区县数据</option>';
        } else {
            city.children.forEach(dist => {
                const opt = document.createElement('option');
                opt.value = dist.value; opt.textContent = dist.label;
                districtSelect.appendChild(opt);
            });
        }
        triggerChange();
    });

    districtSelect.addEventListener('change', triggerChange);

    function triggerChange() {
        const selectedId = districtSelect.value || citySelect.value || provinceSelect.value || '';
        if (typeof onChangeCallback === 'function') onChangeCallback(selectedId);
    }

    return { element: container };
}