frappe.listview_settings["Short Raw Bar"] = {

    hide_name_column: true, // hide the last column which shows the `name`
    hide_name_filter: true, // hide the default filter field for the name column

    filters: [
        ["status", "!=", "出完"]
    ],
  
    get_indicator: function (doc) {
		var colors = {
			未使用: "green",
			半使用: "orange",
			余料: "red",
			出完: "gray",
			Working: "orange",
			"Pending Review": "orange",
			Cancelled: "dark grey",
		};
		return [doc.status, colors[doc.status], "status,=," + doc.status];
	},
};


