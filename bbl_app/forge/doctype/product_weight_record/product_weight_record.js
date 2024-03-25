// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Product Weight Record", {
	refresh(frm) {
        // console.log('wtt113, refresh')
        frm.trigger("setDesc")
        frm.trigger("std_material_ratio")
        frm.trigger("std_material_weight")
        frm.trigger("std_product_weight")
	},

    // 字段改变event
    semi_product_name(frm) {
        // setDesc(frm);
        frm.trigger("setDesc")
    },

    std_material_ratio(frm) {
        frm.trigger("set_meterial_ratio_prop")
    },
    
    std_material_weight(frm) {
        frm.trigger("set_material_weight_prop")
    },
    
    std_product_weight(frm) {
        frm.trigger("set_product_weight_prop")
    },
    
    set_meterial_ratio_prop(frm) {
        let val = frm.doc.std_material_ratio | ''
        let diff = frm.doc.material_ratio_diff | ''
        frm.set_df_property("material_ratio", "description", '标准倍尺：<b>' + val + 'mm</b>, 误差：<b style="color:brown">' + diff + "mm</b>");
    },

    set_material_weight_prop(frm) {
        let val = frm.doc.std_material_weight | ''
        let diff = frm.doc.material_weight_diff | ''
        frm.set_df_property("material_weight", "description", "标准重量：<b>" + val + 'kg</b>, 误差：<b style="color:brown">' + diff + "kg</b>");
    },
    set_product_weight_prop(frm) {
        let val = frm.doc.std_product_weight | ''
        let diff = frm.doc.product_weight_diff | ''
        frm.set_df_property("product_weight", "description", "标准重量：<b>" + val + 'kg</b>, 误差：<b style="color:brown">' + diff + "kg</b>");
    },

    material_ratio(frm) {
        frm.trigger("cacl_material_ratio_diff")
        frm.trigger("set_meterial_ratio_prop")

    },
    material_weight(frm) {
        frm.trigger("cacl_material_weight_diff")
        frm.trigger("set_material_weight_prop")
    },
    product_weight(frm) {
        frm.trigger("cacl_product_weight_diff")
        frm.trigger("set_product_weight_prop")
    },
    
    cacl_product_weight_diff(frm) {
        frm.doc.product_weight_diff = frm.doc.product_weight - frm.doc.std_product_weight
        frm.refresh_field('product_weight_diff');
    },
    cacl_material_weight_diff(frm) {
        frm.doc.material_weight_diff = frm.doc.material_weight - frm.doc.std_material_weight
        frm.refresh_field('material_weight_diff');
    },
    cacl_material_ratio_diff(frm) {
        frm.doc.material_ratio_diff = frm.doc.material_ratio - frm.doc.std_material_ratio
        frm.refresh_field('material_ratio_diff');
    },

    setDesc(frm) {
        semi_product_name = frm.doc.semi_product_name;
        if (!semi_product_name)
            return
        frappe.db.get_doc("Semi Product", semi_product_name)
            .then((doc) => {
                // console.log("promise doc:", doc);
                let mweight = doc.material_weight;
                let pweight = doc.forge_weight;
                let mratio = doc.material_ratio;
                // let desc_name = "标准重量：";
                // console.log("mweight:", mweight, "pweight:", pweight);
                // frm.set_df_property("material_ratio", "description", "标准倍尺：" + mratio);
                // frm.set_df_property("material_weight", "description", "标准重量：" + mweight);
                // frm.set_df_property("product_weight", "description", "标准重量：" + pweight);
                // 新增加的字段自动设值
                if (!frm.doc.raw_material_type && doc.raw_material_type)
                    frm.set_value("raw_material_type", doc.raw_material_type);
                if (!frm.doc.diameter && doc.diameter)
                    frm.set_value("diameter", doc.diameter);
                if (!frm.doc.product_type && doc.product_type)
                    frm.set_value("product_type", doc.product_type);

                
            })
    }
});



