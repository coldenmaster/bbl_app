
Object.assign(bbl.utils, {
    
    is_ms560_680: function() {
        return $(document).width() > 560 && $(document).width() < 680;
    },


    dateSlug(date, digit = 4) {
        return date.toISOString().split('T')[0].replace(/-/g, '').slice(-digit);
    },
    
    semiNameSlug(semi, digit = 16) {
        return semi.replace(/ /g, '').replace(/-/g, '').toUpperCase().slice(-digit);
    },
    
    makeSemiStageName(semi, digit, stageName) {
        return bbl.utils.semiNameSlug(semi, digit) + "_" + stageName;
    },
    
    makeSemiBatchNoName(semi, prefix, heatNo) {
        return prefix + '-' + bbl.utils.dateSlug(new Date()) + '-'
         + bbl.utils.semiNameSlug(semi, 6) + '-' + heatNo.slice(-10);
    },
    

});

bbl.frappe = {
    // 带ls本地缓存的用户名
    get_employee_job_name() {
        let employee_name = localStorage.getItem("prodct_scan_user_name");
        if (!employee_name) {
            employee_name = frappe.session.user_fullname;
        }
        return employee_name;
    }

}

// log("bbl.utils", bbl.utils);