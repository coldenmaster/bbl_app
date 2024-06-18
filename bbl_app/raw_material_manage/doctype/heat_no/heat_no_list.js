frappe.listview_settings["Heat No"] = {

    onload: function (listview) {

        // console.log("Heat No list onload 开始");

        listview.page.add_inner_button(__("test"), function () {
            console.log("Heat No run test()");
            test ();
        });

        test();

    }
  
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

// frappe.require("/assets/bbl_app/js/dialog/bbl_dialog.js", () => {
//     console.log("加载完成");
// });


// frappe.require("/assets/frappe/js/frappe/form/section.js", () => {
//     // Section = new Section();
//     console.log("section.js 加载完成", Section);
// });

// import Section from "./section.js";
// import Tab from "./tab.js";
// import Column from "./column.js";



bbl.Layout = class Layout {
	constructor(opts) {
		this.views = {};
		this.pages = [];
		this.tabs = [];
		this.sections = [];
		this.page_breaks = [];
		this.sections_dict = {};
		this.fields_list = [];
		this.fields_dict = {};
		this.section_count = 0;
		this.column_count = 0;

		$.extend(this, opts);
        console.log("bbl.Layout constructor 结束", this);
        this.make();
        console.log("bbl.Layout make() 结束", this);


	}

	make() {
		if (!this.parent && this.body) {
			this.parent = this.body;
		}
		this.wrapper = $('<div class="form-layout">').appendTo(this.parent);
		this.message = $('<div class="form-message hidden"></div>').appendTo(this.wrapper);
		this.page = $('<div class="form-page"></div>').appendTo(this.wrapper);

		if (!this.fields) {
			this.fields = this.get_doctype_fields();
		}

		if (this.is_tabbed_layout()) {
			this.setup_tabbed_layout();
		}

		this.setup_tab_events();
		this.frm && this.setup_tooltip_events();
		this.render();
	}

	setup_tabbed_layout() {
		$(`
			<div class="form-tabs-list">
				<ul class="nav form-tabs" id="form-tabs" role="tablist"></ul>
			</div>
		`).appendTo(this.page);
		this.tab_link_container = this.page.find(".form-tabs");
		this.tabs_content = $(`<div class="form-tab-content tab-content"></div>`).appendTo(
			this.page
		);
		this.setup_events();
	}

	get_doctype_fields() {
		let fields = [this.get_new_name_field()];
		if (this.doctype_layout) {
			fields = fields.concat(this.get_fields_from_layout());
		} else {
			fields = fields.concat(
				frappe.meta.sort_docfields(frappe.meta.docfield_map[this.doctype])
			);
		}

		return fields;
	}

	get_new_name_field() {
		return {
			parent: this.frm.doctype,
			fieldtype: "Data",
			fieldname: "__newname",
			reqd: 1,
			hidden: 1,
			label: __("Name"),
			get_status: function (field) {
				if (
					field.frm &&
					field.frm.is_new() &&
					field.frm.meta.autoname &&
					["prompt", "name"].includes(field.frm.meta.autoname.toLowerCase())
				) {
					return "Write";
				}
				return "None";
			},
		};
	}

	get_fields_from_layout() {
		const fields = [];
		for (let f of this.doctype_layout.fields) {
			const docfield = copy_dict(frappe.meta.docfield_map[this.doctype][f.fieldname]);
			docfield.label = f.label;
			fields.push(docfield);
		}
		return fields;
	}

	show_message(html, color) {
		if (this.message_color) {
			// remove previous color
			this.message.removeClass(this.message_color);
		}
		let close_message = $(`<div class="close-message">${frappe.utils.icon("close")}</div>`);
		this.message_color =
			color && ["yellow", "blue", "red", "green", "orange"].includes(color) ? color : "blue";
		if (html) {
			if (html.substr(0, 1) !== "<") {
				// wrap in a block
				html = "<div>" + html + "</div>";
			}
			this.message.removeClass("hidden").addClass(this.message_color);
			$(html).appendTo(this.message);
			close_message.appendTo(this.message);
			close_message.on("click", () => this.message.empty().addClass("hidden"));
		} else {
			this.message.empty().addClass("hidden");
		}
	}

	render(new_fields) {
		let fields = new_fields || this.fields;

		this.section = null;
		this.column = null;

		if (this.no_opening_section() && !this.is_tabbed_layout()) {
			this.fields.unshift({ fieldtype: "Section Break" });
		}

		if (this.is_tabbed_layout()) {
			// add a tab without `fieldname` to avoid conflicts
			let default_tab = {
				label: __("Details"),
				fieldtype: "Tab Break",
				fieldname: "__details",
			};

			let first_field_visible = this.fields.find((element) => element.hidden == false);
			let first_tab =
				first_field_visible?.fieldtype === "Tab Break" ? first_field_visible : null;

			if (!first_tab) {
				this.fields.splice(0, 0, default_tab);
			} else {
				// reshuffle __newname field to accomodate under 1st Tab Break
				let newname_field = this.fields.find((df) => df.fieldname === "__newname");
				if (newname_field && newname_field.get_status(this) === "Write") {
					this.fields.splice(0, 1);
					this.fields.splice(1, 0, newname_field);
				}
			}
		}

		fields.forEach((df) => {
			switch (df.fieldtype) {
				case "Fold":
					this.make_page(df);
					break;
				case "Page Break":
					this.make_page_break();
					this.make_section(df);
					break;
				case "Section Break":
					this.make_section(df);
					break;
				case "Column Break":
					this.make_column(df);
					break;
				case "Tab Break":
					this.make_tab(df);
					break;
				default:
					this.make_field(df);
			}
		});
	}

	no_opening_section() {
		return (
			(this.fields[0] && this.fields[0].fieldtype != "Section Break") || !this.fields.length
		);
	}

	no_opening_tab() {
		return (this.fields[1] && this.fields[1].fieldtype != "Tab Break") || !this.fields.length;
	}

	is_tabbed_layout() {
		return this.fields.find((f) => f.fieldtype === "Tab Break");
	}

	replace_field(fieldname, df, render) {
		df.fieldname = fieldname; // change of fieldname is avoided
		if (this.fields_dict[fieldname] && this.fields_dict[fieldname].df) {
			const prev_fieldobj = this.fields_dict[fieldname];
			const fieldobj = this.init_field(df, prev_fieldobj.parent, render);
			prev_fieldobj.$wrapper.replaceWith(fieldobj.$wrapper);
			const idx = this.fields_list.findIndex((e) => e == prev_fieldobj);
			this.fields_list.splice(idx, 1, fieldobj);
			this.fields_dict[fieldname] = fieldobj;
			this.sections.forEach((section) => section.replace_field(fieldname, fieldobj));
			prev_fieldobj.tab?.replace_field(fieldobj);
			this.refresh_fields([df]);
		}
	}

	make_field(df, colspan, render) {
		!this.section && this.make_section();
		!this.column && this.make_column();

		const parent = this.column.form.get(0);
		const fieldobj = this.init_field(df, parent, render);

		// An invalid control name will return in a null fieldobj
		if (!fieldobj) return;

		this.fields_list.push(fieldobj);
		this.fields_dict[df.fieldname] = fieldobj;

		this.section.add_field(fieldobj);
		this.column.add_field(fieldobj);

		if (this.current_tab) {
			this.current_tab.add_field(fieldobj);
		}
	}

	init_field(df, parent, render = false) {
		const fieldobj = frappe.ui.form.make_control({
			df: df,
			doctype: this.doctype,
			parent: parent,
			frm: this.frm,
			render_input: render,
			doc: this.doc,
			layout: this,
		});

		// make_control can return null for invalid control names
		if (fieldobj) {
			fieldobj.layout = this;
		}

		return fieldobj;
	}

	make_page_break() {
		this.page = $('<div class="form-page page-break"></div>').appendTo(this.wrapper);
	}

	make_page(df) {
		let me = this;
		let head = $(`
			<div class="form-clickable-section text-center">
				<a class="btn-fold h6 text-muted">
					${__("Show more details")}
				</a>
			</div>
		`).appendTo(this.wrapper);

		this.page = $('<div class="form-page second-page hide"></div>').appendTo(this.wrapper);

		this.fold_btn = head.find(".btn-fold").on("click", function () {
			let page = $(this).parent().next();
			if (page.hasClass("hide")) {
				$(this).removeClass("btn-fold").html(__("Hide details"));
				page.removeClass("hide");
				frappe.utils.scroll_to($(this), true, 30);
				me.folded = false;
			} else {
				$(this).addClass("btn-fold").html(__("Show more details"));
				page.addClass("hide");
				me.folded = true;
			}
		});

		this.section = null;
		this.folded = true;
	}

	unfold() {
		this.fold_btn.trigger("click");
	}

	make_section(df = {}) {
		this.section_count++;
		if (!df.fieldname) {
			df.fieldname = `__section_${this.section_count}`;
			df.fieldtype = "Section Break";
		}

		this.section = new Section(
			this.current_tab ? this.current_tab.wrapper : this.page,
			df,
			this.card_layout,
			this
		);
		this.sections.push(this.section);
		this.sections_dict[df.fieldname] = this.section;

		// append to layout fields
		if (df) {
			this.fields_dict[df.fieldname] = this.section;
			this.fields_list.push(this.section);
		}

		this.column = null;
	}

	make_column(df = {}) {
		this.column_count++;
		if (!df.fieldname) {
			df.fieldname = `__column_${this.section_count}`;
			df.fieldtype = "Column Break";
		}

		this.column = new Column(this.section, df);
		if (df && df.fieldname) {
			this.fields_list.push(this.column);
		}
	}

	make_tab(df) {
		this.section = null;
		let tab = new Tab(this, df, this.frm, this.tab_link_container, this.tabs_content);
		this.current_tab = tab;
		this.make_section({ fieldtype: "Section Break" });
		this.tabs.push(tab);
		return tab;
	}

	refresh(doc) {
		if (doc) this.doc = doc;

		if (this.frm) {
			this.wrapper.find(".empty-form-alert").remove();
		}

		// NOTE this might seem redundant at first, but it needs to be executed when frm.refresh_fields is called
		this.attach_doc_and_docfields(true);

		if (this.frm && this.frm.wrapper) {
			$(this.frm.wrapper).trigger("refresh-fields");
		}

		// dependent fields
		this.refresh_dependency();

		// refresh sections
		this.refresh_sections();

		if (this.frm) {
			// collapse sections
			this.refresh_section_collapse();
		}

		if (document.activeElement) {
			if (document.activeElement.tagName == "INPUT" && this.is_numeric_field_active()) {
				document.activeElement.select();
			}
		}
	}

	is_numeric_field_active() {
		const control = $(document.activeElement).closest(".frappe-control");
		const fieldtype = (control.data() || {}).fieldtype;
		return frappe.model.numeric_fieldtypes.includes(fieldtype);
	}

	refresh_sections() {
		// hide invisible sections
		this.wrapper.find(".form-section:not(.hide-control)").each(function () {
			const section = $(this).removeClass("empty-section visible-section");
			if (section.find(".frappe-control:not(.hide-control)").length) {
				section.addClass("visible-section");
			} else if (
				section.parent().hasClass("tab-pane") ||
				section.parent().hasClass("form-page")
			) {
				// nothing visible, hide the section
				section.addClass("empty-section");
			}
		});

		// refresh tabs
		this.is_tabbed_layout() && this.refresh_tabs();
	}

	refresh_tabs() {
		for (let tab of this.tabs) {
			tab.refresh();
		}

		const visible_tabs = this.tabs.filter((tab) => !tab.hidden);
		if (visible_tabs && visible_tabs.length == 1) {
			visible_tabs[0].tab_link.toggleClass("hide show");
		}
		this.set_tab_as_active();
	}

	select_tab(label_or_fieldname) {
		for (let tab of this.tabs) {
			if (
				tab.label.toLowerCase() === label_or_fieldname.toLowerCase() ||
				tab.df.fieldname?.toLowerCase() === label_or_fieldname.toLowerCase()
			) {
				tab.set_active();
				return;
			}
		}
	}

	set_tab_as_active() {
		let frm_active_tab = this.frm?.get_active_tab?.();
		if (frm_active_tab) {
			frm_active_tab.set_active();
		} else if (this.tabs.length) {
			// set first tab as active when opening for first time, or new doc
			let first_visible_tab = this.tabs.find((tab) => !tab.is_hidden());
			first_visible_tab && first_visible_tab.set_active();
		}
	}

	refresh_fields(fields) {
		let fieldnames = fields.map((field) => {
			if (field.fieldname) return field.fieldname;
		});

		this.fields_list.map((fieldobj) => {
			if (fieldnames.includes(fieldobj.df.fieldname)) {
				fieldobj.refresh();
				if (fieldobj.df["default"]) {
					fieldobj.set_input(fieldobj.df["default"]);
				}
			}
		});
	}

	add_fields(fields) {
		this.render(fields);
		this.refresh_fields(fields);
	}

	refresh_section_collapse() {
		if (!(this.sections && this.sections.length)) return;

		for (let i = 0; i < this.sections.length; i++) {
			let section = this.sections[i];
			let df = section.df;
			if (df && df.collapsible) {
				let collapse = true;

				if (df.collapsible_depends_on) {
					collapse = !this.evaluate_depends_on_value(df.collapsible_depends_on);
				}

				if (collapse && section.has_missing_mandatory()) {
					collapse = false;
				}

				section.collapse(collapse);
			}
		}
	}

	attach_doc_and_docfields(refresh) {
		let me = this;
		for (let i = 0, l = this.fields_list.length; i < l; i++) {
			let fieldobj = this.fields_list[i];
			if (me.doc) {
				fieldobj.doc = me.doc;
				fieldobj.doctype = me.doc.doctype;
				fieldobj.docname = me.doc.name;
				fieldobj.df =
					frappe.meta.get_docfield(me.doc.doctype, fieldobj.df.fieldname, me.doc.name) ||
					fieldobj.df;
			}
			refresh && fieldobj.df && fieldobj.refresh && fieldobj.refresh();
		}
	}

	refresh_section_count() {
		this.wrapper.find(".section-count-label:visible").each(function (i) {
			$(this).html(i + 1);
		});
	}

	setup_events() {
		let last_scroll = 0;
		let tabs_list = $(".form-tabs-list");
		let tabs_content = this.tabs_content[0];
		if (!tabs_list.length) return;

		$(window).scroll(
			frappe.utils.throttle(() => {
				let current_scroll = document.documentElement.scrollTop;
				if (current_scroll > 0 && last_scroll <= current_scroll) {
					tabs_list.removeClass("form-tabs-sticky-down");
					tabs_list.addClass("form-tabs-sticky-up");
				} else {
					tabs_list.removeClass("form-tabs-sticky-up");
					tabs_list.addClass("form-tabs-sticky-down");
				}
				last_scroll = current_scroll;
			}, 500)
		);

		this.tab_link_container.off("click").on("click", ".nav-link", (e) => {
			e.preventDefault();
			e.stopImmediatePropagation();
			$(e.currentTarget).tab("show");
			if (tabs_content.getBoundingClientRect().top < 100) {
				tabs_content.scrollIntoView();
				setTimeout(() => {
					$(".page-head").css("top", "-15px");
					$(".form-tabs-list").removeClass("form-tabs-sticky-down");
					$(".form-tabs-list").addClass("form-tabs-sticky-up");
				}, 3);
			}
		});
	}

	setup_tab_events() {
		this.wrapper.on("keydown", (ev) => {
			if (ev.which == 9) {
				let current = $(ev.target);
				let doctype = current.attr("data-doctype");
				let fieldname = current.attr("data-fieldname");
				if (doctype) {
					return this.handle_tab(doctype, fieldname, ev.shiftKey);
				}
			}
		});
	}

	setup_tooltip_events() {
		$(document).on("keydown", (e) => {
			if (e.altKey) {
				this.wrapper.addClass("show-tooltip");
			}
		});
		$(document).on("keyup", (e) => {
			if (!e.altKey) {
				this.wrapper.removeClass("show-tooltip");
			}
		});
		this.frm.page &&
			frappe.ui.keys.add_shortcut({
				shortcut: "alt+hover",
				page: this.frm.page,
				description: __("Show Fieldname (click to copy on clipboard)"),
			});
	}

	handle_tab(doctype, fieldname, shift) {
		let grid_row = null,
			prev = null,
			fields = this.fields_list,
			focused = false;

		// in grid
		if (doctype != this.doctype) {
			grid_row = this.get_open_grid_row();
			if (!grid_row || !grid_row.layout) {
				return;
			}
			fields = grid_row.layout.fields_list;
		}

		for (let i = 0, len = fields.length; i < len; i++) {
			if (fields[i].df.fieldname == fieldname) {
				if (shift) {
					if (prev) {
						this.set_focus(prev);
					} else {
						$(this.primary_button).focus();
					}
					break;
				}
				if (i < len - 1) {
					focused = this.focus_on_next_field(i, fields);
				}

				if (focused) {
					break;
				}
			}
			if (this.is_visible(fields[i])) prev = fields[i];
		}

		if (!focused) {
			// last field in this group
			if (grid_row) {
				// in grid
				if (grid_row.doc.idx == grid_row.grid.grid_rows.length) {
					// last row, close it and find next field
					grid_row.toggle_view(false, function () {
						grid_row.grid.frm.layout.handle_tab(
							grid_row.grid.df.parent,
							grid_row.grid.df.fieldname
						);
					});
				} else {
					// next row
					grid_row.grid.grid_rows[grid_row.doc.idx].toggle_view(true);
				}
			} else if (!shift) {
				// End of tab navigation
				$(this.primary_button).focus();
			}
		}

		return false;
	}

	focus_on_next_field(start_idx, fields) {
		// loop to find next eligible fields
		for (let i = start_idx + 1, len = fields.length; i < len; i++) {
			let field = fields[i];
			if (this.is_visible(field)) {
				if (field.df.fieldtype === "Table") {
					// open table grid
					if (!(field.grid.grid_rows && field.grid.grid_rows.length)) {
						// empty grid, add a new row
						field.grid.add_new_row();
					}
					// show grid row (if exists)
					field.grid.grid_rows[0].show_form();
					return true;
				} else if (
					field.df.fieldtype === "Table MultiSelect" ||
					!frappe.model.no_value_type.includes(field.df.fieldtype)
				) {
					this.set_focus(field);
					return true;
				}
			}
		}
	}

	is_visible(field) {
		return (
			field.disp_status === "Write" && field.df && "hidden" in field.df && !field.df.hidden
		);
	}

	set_focus(field) {
		if (field.tab) {
			field.tab.set_active();
		}
		// next is table, show the table
		if (field.df.fieldtype == "Table") {
			if (!field.grid.grid_rows.length) {
				field.grid.add_new_row(1);
			} else {
				field.grid.grid_rows[0].toggle_view(true);
			}
		} else if (field.editor) {
			field.editor.set_focus();
		} else if (field.$input) {
			field.$input.focus();
		}
	}

	get_open_grid_row() {
		return $(".grid-row-open").data("grid_row");
	}

	refresh_dependency() {
		/**
			Resolve "depends_on" and show / hide accordingly
			build dependants' dictionary
		*/

		let has_dep = false;

		const fields = this.fields_list.concat(this.tabs);

		for (let fkey in fields) {
			let f = fields[fkey];
			if (f.df.depends_on || f.df.mandatory_depends_on || f.df.read_only_depends_on) {
				has_dep = true;
				break;
			}
		}

		if (!has_dep) return;

		// show / hide based on values
		for (let i = fields.length - 1; i >= 0; i--) {
			let f = fields[i];
			f.guardian_has_value = true;
			if (f.df.depends_on) {
				// evaluate guardian

				f.guardian_has_value = this.evaluate_depends_on_value(f.df.depends_on);

				// show / hide
				if (f.guardian_has_value) {
					if (f.df.hidden_due_to_dependency) {
						f.df.hidden_due_to_dependency = false;
						f.refresh();
					}
				} else {
					if (!f.df.hidden_due_to_dependency) {
						f.df.hidden_due_to_dependency = true;
						f.refresh();
					}
				}
			}

			if (f.df.mandatory_depends_on) {
				this.set_dependant_property(f.df.mandatory_depends_on, f.df.fieldname, "reqd");
			}

			if (f.df.read_only_depends_on) {
				this.set_dependant_property(
					f.df.read_only_depends_on,
					f.df.fieldname,
					"read_only"
				);
			}
		}

		this.refresh_section_count();
	}

	set_dependant_property(condition, fieldname, property) {
		let set_property = this.evaluate_depends_on_value(condition);
		let value = set_property ? 1 : 0;
		let form_obj;

		if (this.frm) {
			form_obj = this.frm;
		} else if (this.is_dialog || this.doctype === "Web Form") {
			form_obj = this;
		}
		if (form_obj) {
			if (this.doc && this.doc.parent && this.doc.parentfield) {
				form_obj.setting_dependency = true;
				form_obj.set_df_property(
					this.doc.parentfield,
					property,
					value,
					this.doc.parent,
					fieldname,
					this.doc.name
				);
				form_obj.setting_dependency = false;
				// refresh child fields
				this.fields_dict[fieldname] && this.fields_dict[fieldname].refresh();
			} else {
				form_obj.set_df_property(fieldname, property, value);
			}
		}
	}

	evaluate_depends_on_value(expression) {
		let out = null;
		let doc = this.doc;

		if (!doc && this.get_values) {
			doc = this.get_values(true);
		}

		if (!doc) {
			return;
		}

		let parent = this.frm ? this.frm.doc : this.doc || null;

		if (typeof expression === "boolean") {
			out = expression;
		} else if (typeof expression === "function") {
			out = expression(doc);
		} else if (expression.substr(0, 5) == "eval:") {
			try {
				out = frappe.utils.eval(expression.substr(5), { doc, parent });
				if (parent && parent.istable && expression.includes("is_submittable")) {
					out = true;
				}
			} catch (e) {
				frappe.throw(__('Invalid "depends_on" expression'));
			}
		} else if (expression.substr(0, 3) == "fn:" && this.frm) {
			out = this.frm.script_manager.trigger(
				expression.substr(3),
				this.doctype,
				this.docname
			);
		} else {
			var value = doc[expression];
			if ($.isArray(value)) {
				out = !!value.length;
			} else {
				out = !!value;
			}
		}

		return out;
	}
};



/* ***************************************** */




/* ***************************************** */


bbl.FieldGroup = class FieldGroup extends bbl.Layout {
	constructor(opts) {
		super(opts);
		this.dirty = false;
		$.each(this.fields || [], function (i, f) {
			if (!f.fieldname && f.label) {
				f.fieldname = f.label.replace(/ /g, "_").toLowerCase();
			}
		});
		if (this.values) {
			this.set_values(this.values);
		}
        console.log("bbl.FieldGroup constructor 开始", this);
	}

	make() {
		let me = this;
		if (this.fields) {
			super.make();
			this.refresh();
			// set default
			$.each(this.fields_list, function (i, field) {
				if (field.df["default"]) {
					let def_value = field.df["default"];

					if (def_value == "Today" && field.df["fieldtype"] == "Date") {
						def_value = frappe.datetime.get_today();
					}

					field.set_input(def_value);
					// if default and has depends_on, render its fields.
					me.refresh_dependency();
				}
			});

			if (!this.no_submit_on_enter) {
				this.catch_enter_as_submit();
			}

			$(this.wrapper)
				.find("input, select")
				.on("change awesomplete-selectcomplete", () => {
					this.dirty = true;
					frappe.run_serially([
						() => frappe.timeout(0.1),
						() => me.refresh_dependency(),
					]);
				});
		}
	}

	focus_on_first_input() {
		if (this.no_focus) return;
		$.each(this.fields_list, function (i, f) {
			if (!["Date", "Datetime", "Time", "Check"].includes(f.df.fieldtype) && f.set_focus) {
				f.set_focus();
				return false;
			}
		});
	}

	catch_enter_as_submit() {
		let me = this;
		$(this.body)
			.find('input[type="text"], input[type="password"], select')
			.keypress(function (e) {
				if (e.which == 13) {
					if (me.has_primary_action) {
						e.preventDefault();
						me.get_primary_btn().trigger("click");
					}
				}
			});
	}

	get_input(fieldname) {
		let field = this.fields_dict[fieldname];
		if (!field) return "";
		return $(field.txt ? field.txt : field.input);
	}

	get_field(fieldname) {
		return this.fields_dict[fieldname];
	}

	get_values(ignore_errors, check_invalid) {
		let ret = {};
		let errors = [];
		let invalid = [];

		for (let key in this.fields_dict) {
			let f = this.fields_dict[key];
			if (f.get_value) {
				let v = f.get_value();
				if (f.df.reqd && is_null(typeof v === "string" ? strip_html(v) : v))
					errors.push(__(f.df.label));

				if (f.df.reqd && f.df.fieldtype === "Text Editor" && is_null(strip_html(cstr(v))))
					errors.push(__(f.df.label));

				if (!is_null(v)) ret[f.df.fieldname] = v;
			}

			if (this.is_dialog && f.df.reqd && !f.value) {
				f.refresh_input();
			}

			if (f.df.invalid) {
				invalid.push(__(f.df.label));
			}
		}

		if (errors.length && !ignore_errors) {
			frappe.msgprint({
				title: __("Missing Values Required"),
				message:
					__("Following fields have missing values:") +
					"<br><br><ul><li>" +
					errors.join("<li>") +
					"</ul>",
				indicator: "orange",
			});
			return null;
		}

		if (invalid.length && check_invalid) {
			frappe.msgprint({
				title: __("Inavlid Values"),
				message:
					__("Following fields have invalid values:") +
					"<br><br><ul><li>" +
					invalid.join("<li>") +
					"</ul>",
				indicator: "orange",
			});
			return null;
		}
		return ret;
	}

	get_value(key) {
		let f = this.fields_dict[key];
		return f && (f.get_value ? f.get_value() : null);
	}

	set_value(key, val) {
		return new Promise((resolve) => {
			let f = this.fields_dict[key];
			if (f) {
				f.set_value(val).then(() => {
					f.set_input?.(val);
					this.refresh_dependency();
					resolve();
				});
			} else {
				resolve();
			}
		});
	}

	has_field(fieldname) {
		return !!this.fields_dict[fieldname];
	}

	set_input(key, val) {
		return this.set_value(key, val);
	}

	set_values(dict) {
		let promises = [];
		for (let key in dict) {
			if (this.fields_dict[key]) {
				promises.push(this.set_value(key, dict[key]));
			}
		}

		return Promise.all(promises);
	}

	clear() {
		for (let key in this.fields_dict) {
			let f = this.fields_dict[key];
			if (f && f.set_input) {
				f.set_input(f.df["default"] || "");
			}
		}
	}

	set_df_property(fieldname, prop, value) {
		if (!fieldname) {
			return;
		}
		const field = this.get_field(fieldname);
		field.df[prop] = value;
		field.refresh();
	}
};
/* ******************************* */




/* ******************************* */

bbl.Dialog = class Dialog extends bbl.FieldGroup {
	constructor(opts) {
		super();
		this.display = false;
		this.is_dialog = true;

		$.extend(this, { animate: true, size: null }, opts);
		this.make();
        console.log("bbl.Dialog constructor 开始", this);
	}

	make() {
		this.$wrapper = frappe.get_modal("", "");

		if (this.static) {
			this.$wrapper.modal({
				backdrop: "static",
				keyboard: false,
			});
			this.get_close_btn().hide();
		}

		if (!this.size) this.set_modal_size();

		this.wrapper = this.$wrapper.find(".modal-dialog").get(0);
		if (this.size == "small") $(this.wrapper).addClass("modal-sm");
		else if (this.size == "large") $(this.wrapper).addClass("modal-lg");
		else if (this.size == "extra-large") $(this.wrapper).addClass("modal-xl");

		this.make_head();
		this.modal_body = this.$wrapper.find(".modal-body");
		this.$body = $("<div></div>").appendTo(this.modal_body);
		this.body = this.$body.get(0);
		this.$message = $('<div class="hide modal-message"></div>').appendTo(this.modal_body);
		this.header = this.$wrapper.find(".modal-header");
		this.footer = this.$wrapper.find(".modal-footer");
		this.standard_actions = this.footer.find(".standard-actions");
		this.custom_actions = this.footer.find(".custom-actions");
		this.set_indicator();

		// make fields (if any)
		super.make();

		this.refresh_section_collapse();

		// show footer
		this.action = this.action || { primary: {}, secondary: {} };
		if (this.primary_action || (this.action.primary && this.action.primary.onsubmit)) {
			this.set_primary_action(
				this.primary_action_label ||
					this.action.primary.label ||
					__("Submit", null, "Primary action in dialog"),
				this.primary_action || this.action.primary.onsubmit
			);
		}

		if (this.secondary_action) {
			this.set_secondary_action(this.secondary_action);
		}

		if (
			this.secondary_action_label ||
			(this.action.secondary && this.action.secondary.label)
		) {
			this.set_secondary_action_label(
				this.secondary_action_label || this.action.secondary.label
			);
		}

		if (this.minimizable) {
			this.header
				.find(".title-section")
				.click(() => this.is_minimized && this.toggle_minimize());
			this.get_minimize_btn()
				.removeClass("hide")
				.on("click", () => this.toggle_minimize());
		}

		var me = this;
		this.$wrapper
			.on("hide.bs.modal", function () {
				me.display = false;
				me.is_minimized = false;
				me.hide_scrollbar(false);
				// hide any grid row form if open
				frappe.ui.form.get_open_grid_form?.()?.hide_form();

				if (frappe.ui.open_dialogs[frappe.ui.open_dialogs.length - 1] === me) {
					frappe.ui.open_dialogs.pop();
					if (frappe.ui.open_dialogs.length) {
						window.cur_dialog =
							frappe.ui.open_dialogs[frappe.ui.open_dialogs.length - 1];
					} else {
						window.cur_dialog = null;
					}
				}
				me.onhide && me.onhide();
				me.on_hide && me.on_hide();
			})
			.on("shown.bs.modal", function () {
				// focus on first input
				me.display = true;
				window.cur_dialog = me;
				frappe.ui.open_dialogs.push(me);
				me.focus_on_first_input();
				me.hide_scrollbar(true);
				me.on_page_show && me.on_page_show();
				$(document).trigger("frappe.ui.Dialog:shown");
				$(document).off("focusin.modal");
			})
			.on("scroll", function () {
				var $input = $("input:focus");
				if (
					$input.length &&
					["Date", "Datetime", "Time"].includes($input.attr("data-fieldtype"))
				) {
					$input.blur();
				}
			});
	}

	set_modal_size() {
		if (!this.fields) {
			this.size = "";
			return;
		}

		let col_brk = 0;
		let cur_col_brk = 0;

		// if fields have more than 2 Column Breaks before encountering Section Break, make it large
		this.fields.forEach((field) => {
			if (field.fieldtype == "Column Break") {
				cur_col_brk++;

				if (cur_col_brk > col_brk) {
					col_brk = cur_col_brk;
				}
			} else if (field.fieldtype == "Section Break") {
				cur_col_brk = 0;
			}
		});

		this.size = col_brk >= 4 ? "extra-large" : col_brk >= 2 ? "large" : "";
	}

	get_primary_btn() {
		return this.standard_actions.find(".btn-primary");
	}

	get_minimize_btn() {
		return this.$wrapper.find(".modal-header .btn-modal-minimize");
	}

	set_message(text) {
		this.$message.removeClass("hide");
		this.$body.addClass("hide");
		this.$message.text(text);
	}

	clear_message() {
		this.$message.addClass("hide");
		this.$body.removeClass("hide");
	}

	clear() {
		super.clear();
		this.clear_message();
	}

	set_primary_action(label, click) {
		this.footer.removeClass("hide");
		this.has_primary_action = true;
		var me = this;
		const primary_btn = this.get_primary_btn().removeClass("hide").html(label);
		if (typeof click == "function") {
			primary_btn.off("click").on("click", function () {
				me.primary_action_fulfilled = true;
				// get values and send it
				// as first parameter to click callback
				// if no values then return
				var values = me.get_values();
				if (!values) return;
				click && click.apply(me, [values]);
			});
		}
		return primary_btn;
	}

	set_secondary_action(click) {
		this.footer.removeClass("hide");
		return this.get_secondary_btn().removeClass("hide").off("click").on("click", click);
	}

	set_secondary_action_label(label) {
		this.get_secondary_btn().removeClass("hide").html(label);
	}

	disable_primary_action() {
		this.get_primary_btn().addClass("disabled");
	}

	enable_primary_action() {
		this.get_primary_btn().removeClass("disabled");
	}

	make_head() {
		this.set_title(this.title);
	}

	set_title(t) {
		this.$wrapper.find(".modal-title").html(t);
	}

	set_indicator() {
		if (this.indicator) {
			this.header
				.find(".indicator")
				.removeClass()
				.addClass("indicator " + this.indicator);
		}
	}

	show() {
		// show it
		if (this.animate) {
			this.$wrapper.addClass("fade");
		} else {
			this.$wrapper.removeClass("fade");
		}
		this.$wrapper.modal("show");

		this.$wrapper.removeClass("modal-minimize");

		if (this.minimizable && this.is_minimized) {
			$(".modal-backdrop").toggle();
			this.is_minimized = false;
		}

		// clear any message
		this.clear_message();

		this.primary_action_fulfilled = false;
		this.is_visible = true;
		return this;
	}

	hide() {
		this.$wrapper.modal("hide");
		this.is_visible = false;
	}

	get_close_btn() {
		return this.$wrapper.find(".btn-modal-close");
	}

	get_secondary_btn() {
		return this.standard_actions.find(".btn-modal-secondary");
	}

	no_cancel() {
		this.get_close_btn().toggle(false);
	}

	cancel() {
		this.get_close_btn().trigger("click");
	}

	toggle_minimize() {
		$(".modal-backdrop").toggle();
		let modal = this.$wrapper.closest(".modal").toggleClass("modal-minimize");
		modal.attr("tabindex") ? modal.removeAttr("tabindex") : modal.attr("tabindex", -1);
		this.is_minimized = !this.is_minimized;
		const icon = this.is_minimized ? "expand" : "collapse";
		this.get_minimize_btn().html(frappe.utils.icon(icon));
		this.on_minimize_toggle && this.on_minimize_toggle(this.is_minimized);
		this.header.find(".modal-title").toggleClass("cursor-pointer");
		this.hide_scrollbar(!this.is_minimized);
	}

	hide_scrollbar(bool) {
		$("body").css("overflow", bool ? "hidden" : "auto");
	}

	add_custom_action(label, action, css_class = null) {
		this.footer.removeClass("hide");
		let action_button = $(`
			<button class="btn btn-secondary btn-sm ${css_class || ""}">
				${label}
			</button>
		`);
		this.custom_actions.append(action_button);

		action && action_button.click(action);
	}
};

/* ******************************* */




/* ******************************* */
class Section {
	constructor(parent, df, card_layout, layout) {
		this.layout = layout;
		this.card_layout = card_layout;
		this.parent = parent;
		this.df = df || {};
		this.columns = [];
		this.fields_list = [];
		this.fields_dict = {};

		this.make();

		if (
			this.df.label &&
			this.df.collapsible &&
			localStorage.getItem(df.css_class + "-closed")
		) {
			this.collapse();
		}

		this.row = {
			wrapper: this.wrapper,
		};

		this.refresh();
	}

	make() {
		let make_card = this.card_layout;
		this.wrapper = $(`<div class="row
				${this.df.is_dashboard_section ? "form-dashboard-section" : "form-section"}
				${make_card ? "card-section" : ""}" data-fieldname="${this.df.fieldname}">
			`).appendTo(this.parent);

		if (this.df) {
			if (this.df.label) {
				this.make_head();
			}
			if (this.df.description) {
				this.description_wrapper = $(
					`<div class="col-sm-12 form-section-description">
						${__(this.df.description)}
					</div>`
				);

				this.wrapper.append(this.description_wrapper);
			}
			if (this.df.css_class) {
				this.wrapper.addClass(this.df.css_class);
			}
			if (this.df.hide_border) {
				this.wrapper.toggleClass("hide-border", true);
			}
		}

		this.body = $('<div class="section-body">').appendTo(this.wrapper);

		if (this.df.body_html) {
			this.body.append(this.df.body_html);
		}
	}

	make_head() {
		this.head = $(`
			<div class="section-head">
				${__(this.df.label, null, this.df.parent)}
				<span class="ml-2 collapse-indicator mb-1"></span>
			</div>
		`);

		this.head.appendTo(this.wrapper);
		this.indicator = this.head.find(".collapse-indicator");
		this.indicator.hide();

		if (this.df.collapsible) {
			this.head.addClass("collapsible");
			// show / hide based on status
			this.collapse_link = this.head.on("click", () => {
				this.collapse();
			});
			this.set_icon();
			this.indicator.show();
		}
	}

	replace_field(fieldname, fieldobj) {
		if (this.fields_dict[fieldname]?.df) {
			const olfldobj = this.fields_dict[fieldname];
			const idx = this.fields_list.findIndex((e) => e == olfldobj);
			this.fields_list.splice(idx, 1, fieldobj);
			this.fields_dict[fieldname] = fieldobj;
			fieldobj.section = this;
		}
	}

	add_field(fieldobj) {
		this.fields_list.push(fieldobj);
		this.fields_dict[fieldobj.df.fieldname] = fieldobj;
		fieldobj.section = this;
	}

	refresh(hide) {
		if (!this.df) return;
		// hide if explicitly hidden
		hide = hide || this.df.hidden || this.df.hidden_due_to_dependency;
		this.wrapper.toggleClass("hide-control", !!hide);
	}

	collapse(hide) {
		// unknown edge case
		if (!(this.head && this.body)) {
			return;
		}

		if (hide === undefined) {
			hide = !this.body.hasClass("hide");
		}

		this.body.toggleClass("hide", hide);
		this.head && this.head.toggleClass("collapsed", hide);

		this.set_icon(hide);

		this.fields_list.forEach((f) => f.on_section_collapse && f.on_section_collapse(hide));

		// save state for next reload ('' is falsy)
		if (this.df.css_class)
			localStorage.setItem(this.df.css_class + "-closed", hide ? "1" : "");
	}

	set_icon(hide) {
		let indicator_icon = hide ? "es-line-down" : "es-line-up";
		this.indicator && this.indicator.html(frappe.utils.icon(indicator_icon, "sm", "mb-1"));
	}

	is_collapsed() {
		return this.body.hasClass("hide");
	}

	has_missing_mandatory() {
		let missing_mandatory = false;
		for (let j = 0, l = this.fields_list.length; j < l; j++) {
			const section_df = this.fields_list[j].df;
			if (section_df.reqd && this.layout.doc[section_df.fieldname] == null) {
				missing_mandatory = true;
				break;
			}
		}
		return missing_mandatory;
	}

	hide() {
		this.on_section_toggle(false);
	}

	show() {
		this.on_section_toggle(true);
	}

	on_section_toggle(show) {
		this.wrapper.toggleClass("hide-control", !show);
		// this.on_section_toggle && this.on_section_toggle(show);
	}
}

console.log("test Dialog 加载完成");













