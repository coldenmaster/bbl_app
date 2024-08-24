
frappe.provide("bbl");

window.log = console.log;


bbl.utils = {
    test_str: "abcd",

    // 计算下料根数
    calc_bar_piece: function(per_length, piece, ratio, gap) {
        per_length = cint(per_length);
        ratio = cint(ratio);
        piece = cint(piece);
        let total_p = cint(per_length / (ratio + gap)) * piece;
        let remain_weight = per_length * piece - total_p * (ratio + gap);
        // console.log("下料根数计算：", total_p, remain_weight);
        return [total_p, remain_weight]
    },

    // 原钢长度质量换算
    raw_leng_to_weight: function(dia, length, density=7.9) {
        dia = cint(dia);
        length = cint(length);
        if (!dia || !length ) {
            // frappe.show_alert("计算重量时，直径或长度为空");
            return 0;
        }
        let volume = dia * dia * 3.1415926 / 4 * length;
        let weight = flt(volume * density / 1000 / 1000);
        return weight;
    },

    // 圆钢重量长度换算 kg to mm
    raw_weight_to_length: function(weight, dia, density=7.9) {
        weight = cint(weight), dia = cint(dia);
        // console.log("圆钢重量长度换算", weight, dia, density)
        let volume = weight * 1000 * 1000 / density
        let length = volume / (dia * dia * 3.1415926 / 4)
        // console.log("圆钢重量长度换算2", volume, length)
        return cint(length);
    },

}



bbl.utils.t1 = "t12";



console.log("utils.js loaded");


