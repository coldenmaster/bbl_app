// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Bbl Location Point", {
	refresh(frm) {
        
        frm.add_custom_button('zan位', () => {
        }),

        frm.add_custom_button('定位', () => {

            let options = {
                enableHighAccuracy: true,
                maximumAge: 3000,
            }

            navigator.geolocation.getCurrentPosition(function (position) {
                // frappe.msgprint("定位成功");
                // console.log(frm);

                let lat = position.coords.latitude;
                let long = position.coords.longitude;

                frm.doc.latitude = lat;
                // frm.doc.longitude = long;
                frm.doc.accuracy = position.coords.accuracy;
                frm.doc.altitude = position.coords.altitude;
                frm.doc.longitude = position.coords.longitude;
                frm.doc.altitude_accuracy = position.coords.altitudeAccuracy;
                frm.doc.heading = position.coords.heading;
                frm.doc.speed = position.coords.speed;
                frm.doc.timestamp = moment(position.timestamp).format("YYYY-MM-DD hh:mm:ss A");
                // frm.doc.timestamp = moment(position.timestamp).format("YYYY-MM-DD HH:mm:ss");


                frm.refresh();

                console.log(position.timestamp);


            }, function (error) {
                frappe.msgprint("定位失败");
                console.log(error);
                // frappe.msgprint(error);
            }, options
            )
            // console.log("OVER");
            // frappe.msgprint(__('Waiting for Location'));
            // location_success2(frm);


        })
	},

    location_success(frm) {
        frappe.msgprint("location_success");
    }

});

function location_success2(frm) {
    console.log("location_success 2");
}

