// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

bold_brown = '<b style="color:brown">'
bold_green = '<b style="color:green">'
calc_coler = (val) => {
    c = '<b>'
    if (val > 2) 
        c = bold_brown
    else if (val < -2)
        c = bold_green
    return c
}

frappe.ui.form.on("Product Weight Record", {
	refresh(frm) {
        // console.log('wtt113, refresh')
        frm.trigger("setDesc")
        frm.trigger("trig_disp_prop")
	},

    // 字段改变event
    semi_product_name(frm) {
        frm.trigger("setDesc")
    },
    // 标准值
    std_material_ratio(frm) {
        frm.trigger("cacl_material_ratio_diff")
    },
    
    std_material_weight(frm) {
        frm.trigger("cacl_material_weight_diff")
    },
    
    std_product_weight(frm) {
        frm.trigger("cacl_product_weight_diff")
    },
    // 录入值
    material_ratio(frm) {
        frm.trigger("cacl_material_ratio_diff")

    },
    material_weight(frm) {
        frm.trigger("cacl_material_weight_diff")
    },
    product_weight(frm) {
        frm.trigger("cacl_product_weight_diff")
    },
    // 差
    material_ratio_diff(frm) {
        frm.trigger("set_meterial_ratio_prop")
    },
    material_weight_diff(frm) {
        frm.trigger("set_material_weight_prop")
    },
    product_weight_diff(frm) {
        frm.trigger("set_product_weight_prop")
    },
    
    set_meterial_ratio_prop(frm) {
        let val = frm.doc.std_material_ratio | ''
        let diff = frm.doc.material_ratio_diff | ''
        let color = calc_coler(diff)
        frm.set_df_property("material_ratio", "description", '标准倍尺：<b>' + val + 'mm</b>, 误差：' + color + diff + "mm</b>");
    },

    set_material_weight_prop(frm) {
        let val = frappe.format(frm.doc.std_material_weight , {fieldtype: 'Float', precision: 2}, { inline: true })
        let diff = frappe.format(frm.doc.material_weight_diff , {fieldtype: 'Float', precision: 2}, { inline: true })
        let color = calc_coler(diff)
        frm.set_df_property("material_weight", "description", "标准重量：<b>" + val + 'kg</b>, 误差：' + color + diff + "kg</b>");
    },
    set_product_weight_prop(frm) {
        let val = frappe.format(frm.doc.std_product_weight , {fieldtype: 'Float', precision: 2}, { inline: true })
        let diff = frappe.format(frm.doc.product_weight_diff , {fieldtype: 'Float', precision: 2}, { inline: true })
        let color = calc_coler(diff)
        frm.set_df_property("product_weight", "description", "标准重量：<b>" + val + 'kg</b>, 误差：' + color + diff + "kg</b>");
    },
    trig_disp_prop(frm) {
        frm.trigger("set_meterial_ratio_prop")
        frm.trigger("set_material_weight_prop")
        frm.trigger("set_product_weight_prop")
    },

    cacl_material_ratio_diff(frm) {
        diff = 0;
        if (frm.doc.material_ratio && frm.doc.std_material_ratio) 
            diff = frm.doc.material_ratio - frm.doc.std_material_ratio;
        frm.set_value("material_ratio_diff", diff);
        frm.trigger("set_meterial_ratio_prop")
    },
    cacl_material_weight_diff(frm) {
        diff = 0;
        if (frm.doc.material_weight && frm.doc.std_material_weight) 
            diff = frm.doc.material_weight - frm.doc.std_material_weight;
        frm.set_value("material_weight_diff", diff);
        // frm.set_value("material_weight_diff", frm.doc.material_weight - frm.doc.std_material_weight);
        frm.trigger("set_material_weight_prop")
    },
    cacl_product_weight_diff(frm) {
        diff = 0;
        if (frm.doc.product_weight && frm.doc.std_product_weight) 
            diff = frm.doc.product_weight - frm.doc.std_product_weight;
        frm.set_value("product_weight_diff", diff);
        // frm.set_value("product_weight_diff", frm.doc.product_weight - frm.doc.std_product_weight);
        frm.trigger("set_product_weight_prop")
    },

    setDesc(frm) {
        semi_product_name = frm.doc.semi_product_name;
        if (!semi_product_name)
            return;
        frappe.db.get_doc("Semi Product", semi_product_name)
            .then((doc) => {
                // console.log("intos setDesc, doc:", doc);
                if (!frm.doc.raw_material_type && doc.raw_material_type)
                    frm.set_value("raw_material_type", doc.raw_material_type);
                if (!frm.doc.diameter && doc.diameter)
                    frm.set_value("diameter", doc.diameter);
                if (!frm.doc.product_type && doc.product_type)
                    frm.set_value("product_type", doc.product_type);

                if (!frm.doc.std_product_weight && doc.product_weight) 
                    frm.set_value("std_product_weight", doc.forge_weight);
                if (!frm.doc.std_material_weight && doc.material_weight)
                    frm.set_value("std_material_weight", doc.material_weight);
                if (!frm.doc.std_material_ratio && doc.material_ratio)
                    frm.set_value("std_material_ratio", doc.material_ratio);


                if (!frm.doc.material_ratio_diff) {
                    frm.trigger("cacl_material_ratio_diff");
                }
                if (!frm.doc.material_weight_diff)
                    frm.trigger("cacl_material_weight_diff");
                if (!frm.doc.product_weight_diff)
                    frm.trigger("cacl_product_weight_diff");

            })
    }

});



