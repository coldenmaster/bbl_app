

frappe.listview_settings["Semi Handover"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    get_indicator: function (doc) {
        let status = doc.docstatus;
        if (status == 1 && doc.used == 1)
            status = 3;
        status_map = {
            0: "Draft",
            1: "Submitted",
            2: "Cacelled",
            3: "Used",
        }
		var colors = {
			Draft: "red",
			Submitted: "blue",
			Cancelled: "gray",
            Used: "green",
			// 用完: "gray",
			// Working: "orange",
			// "Pending Review": "orange",
			// Cancelled: "dark grey",
        }
	
        return [status_map[status], 
            colors[status_map[status]], 
            "status,=," + doc.used];
	},

}