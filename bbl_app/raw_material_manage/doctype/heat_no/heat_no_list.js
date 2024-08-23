frappe.listview_settings["Heat No"] = {

    onload: function (listview) {

        // console.log("Heat No list onload 开始");

        // listview.page.add_inner_button(__("test"), function () {
        //     console.log("Heat No run test()");
        //     test ();
        // });

    },

    get_indicator: function (doc) {
		var colors = {
			合格: "green",
			不合格: "red",
			未检验: "orange",
			null: "gray",
			Working: "orange",
			"Pending Review": "orange",
			退货: "dark grey",
		};
		return [doc.status || "&emsp;&emsp;", colors[doc.status], "status,=," + doc.status];
	},

  
};

function test () {
    let d = new bbl.Dialog({
        t1: 1,
        t2: "2",
        // fields: {
        //     find: function() {return "test";}
    
        // },
        fields:[],
    })

    d.show();
    bbl.d = d;
    // console.log("test 结束", d);
}

