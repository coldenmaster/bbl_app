// Copyright (c) 2024, bbl and contributors
// For license information, please see license.txt

frappe.ui.form.on("Semi Product Operate", {
    op_source: "",

    setup(frm) {
        // f = frappe;
        frm = cur_frm;
    },
    on_submit(frm) {
        log("spo on_submit", frm)
    },
	refresh(frm) {
        if (frm.is_new()) {
            frm.add_custom_button("挑选半成品", () => {
                // frm.trigger("clearForm"); // 占位，手机段第一个显示不出来
                select_spm_dialog(frm);
                // frm.doc.show2 = 1;
                // frm.toggle_display(['length2', 'piece2', 'length3', 'piece3'], true);
            })
            // frm.change_custom_button_type("挑选半成品", null, 'primary');
            frm.change_custom_button_type("挑选半成品", null, 'info');
    
        };  
        
        
        set_default(frm);
        setup_search_basket_field(frm);
        // frm.trigger("semi_product");
        // frm.trigger("semi_op_source");
        judge_fields_display(frm);
	},
    semi_product(frm) {
        op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);

    },
    semi_op_source(frm) {
        const op_source = cat_op_source(frm);
        set_spm_filter(frm, op_source);
        set_target_form_filter(frm, frm.doc.semi_op_source);
        set_forge_batch_no_disp(frm);
    },
    spm_source(frm) {
        cat_finish_name(frm);
        query_spm_source_data(frm);
    },
    semi_op_target(frm) {
        cat_finish_name(frm);
        set_bbl_heat_no_disp(frm);
    },
    source_qty(frm) {
        frm.set_value("finish_qty", frm.doc.source_qty);
    },
    finish_qty(frm) {
        if (frm.doc.finish_qty > frm.doc.source_qty) {
            frappe.msgprint({ "title": "错误", message: "目标数量不能大于源数量", indicator: "red", alert: 1 });
            frm.set_value("finish_qty", "");
        }
    }

});

function set_default(frm) {
    if (frm.is_new()) {
        frm.set_value("employee", frappe.session.user_fullname);
        frm.set_value("semi_op_target", "");
    }
}
function cat_op_source(frm) {
    const name = frm.doc.semi_product ? frm.doc.semi_product + "_" : "";
    const form = frm.doc.semi_op_source || "";
    return name + form;
}
function cat_finish_name(frm) {
    // 挑选产品 + 选择目标形态 = 自动进行设置
    const spm_source = frm.doc.product_name || "";
    const semi_op_target = frm.doc.semi_op_target || "";
    let val = ""
    if (spm_source && semi_op_target) {
        const spm_0 = spm_source.split(/_[^_]+$/, 2)[0];
        val = spm_0 + "_" + semi_op_target
    }
    frm.set_value("finish_name", val);
}

function query_spm_source_data(frm) {
    const spm_source = frm.doc.spm_source || "";
    if (spm_source) {
        frappe.model.with_doc("Semi Product Manage", spm_source).then(doc => {
            log("with_doc2", doc);
            frm.set_value("forge_batch_no", doc.forge_batch_no);
            frm.set_value("bbl_heat_no", doc.bbl_heat_no);
        })
    };
}

function set_spm_filter(frm, op_source) {
    if (frm.is_new())
        frm.set_value("spm_source", "");
    frm.set_query("spm_source", function () {
        return {
            filters: {
                semi_product_name: ["like", `%${op_source}%`],
                remaining_piece: ["!=", "0"]
            },
        };
    });
}

function set_target_form_filter(frm, value) {
    frm.set_query("semi_op_target", function () {
        return {
            filters: {
                name: ["!=", value]
            },
        };
    });
}

function judge_fields_display(frm) {
    /* 判断哪些字段可进行隐藏，简洁显示页面 */
    // 锻造批次号填写了就不用显示了
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    
    set_forge_batch_no_disp(frm) 
    set_bbl_heat_no_disp(frm);
}

function set_forge_batch_no_disp(frm) {
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    const last_op = frm.doc.semi_op_source;
    let fd = frm.get_field("forge_batch_no");
    if (last_op != "锻坯登记") 
        set_frm_df_rend(fd, 0, 0);
    else    
        set_frm_df_rend(fd, 1, 1);

}
function set_bbl_heat_no_disp(frm) {
    if (!frm.is_new())  // 新建时，隐藏字段，对界面进行简化
        return;
    const bbl_heat_no_list = ["调质", "正火", "淬火", "回火"];
    const target_op = frm.doc.semi_op_target;
    let fd = frm.get_field("bbl_heat_no");
    if (!bbl_heat_no_list.includes(target_op)) {
        set_frm_df_rend(fd, 0, 0);
    } else {
        set_frm_df_rend(fd, 1, 1);
    }
}

function setup_search_basket_field(frm) {
    const $wrapper = frm.get_field("spm_source").$wrapper;
    $wrapper.find(".control-input").append(
        `<span class="link-btn">
            <a class="btn-open no-decoration" title="${__("根据料框选择加工的成品")}">
                ${'选框🛒'.fontcolor("#0080FF")}
            </a>
        </span>`
    );
    // ${frappe.utils.icon("stock", "m")}

    const $scan_btn = $wrapper.find(".link-btn");
    $scan_btn.toggle(true);
    
    $scan_btn.on("click", "a", (r) => {
        log("触发小图标 click", r);
        frappe.prompt("请输入料框编号", (values) => {
            frappe.db.get_value("Semi Product Manage", 
            {
                "basket_no":values.value,
                "remaining_piece":[">", 0],
            }, 
            ["name", "semi_product_name"], 
            (r) => {
                log("getaa", r)
            if (r && r.name) {
                li = r.semi_product_name.split("_");
                log(li);
                frm.set_value("semi_product", li[0]);
                frm.set_value("semi_op_source", li[1]);
                setTimeout(() => {
                    frm.set_value("spm_source", r.name);
                }, 100);
            } else 
                frappe.msgprint(`未找到框号 ${values.value.bold()} 的半成品`, alert=true);
            })
            // .then(r => {
            //     log("get2", r)
            // })
            
        },"选择框号", "确定")

    });
}



// utils
function set_frm_df_rend(df, show, reqd) {
    df.toggle(!!show);
    df.df.reqd = !!reqd;
    df.set_required();
    // df.df.read_only = !!readonly;
    // df.refresh();
}




function select_spm_dialog(frm) { 
    log("select_spm_dialog frm:", frm);
       
    let sps = new SpmSelectDialog({
        doctype: "Semi Product Manage",
        target: frm,
        // setters: {
        //     semi_product_name: null,
        //     remaining_piece: null,
        // },
        setters: [
            {
                fieldtype: "Data",
                fieldname: "semi_product_name",
                hidden: 1,
                label: "工件名称",
            }, {
                fieldtype: "Link",
                options: "Forge Batch No",
                fieldname: "forge_batch_no",
                label: "锻造批次",
            }, {
                fieldtype: "Link",
                options: "Employee Jobs",
                fieldname: "employee",
                label: "员工",
            }, {
                fieldtype: "Int",
                fieldname: "remaining_piece",
                label: "数量",
            }, {
                fieldtype: "Int",
                fieldname: "basket_in",
                label: "框号",
            }, {
                fieldtype: "Data",
                fieldname: "op_mark",
                label: "标记",
            }, 
        ],
        add_filters_group: 1,
        // date_field: "for_date",
        date_field: "creation",
        // data_fields: [
        //     {
        //         fieldtype: "Data",
        //         fieldname: "add_field1",
        //         label: "add_field1",
        //     },
        // ],
        columns: ["semi_product_name", "forge_batch_no", "remaining_piece", "for_date"],
        get_query() {
            return {
                filters: { 
                    status: ['!=', "用完"],
                    // semi_product: "4E",
                }
            }
        },
        primary_action_label: "加工处理",
        action(selections) {
            console.log(selections);
            if (selections.length != 1) {
                frappe.msgprint("请选择一个半成品");
            }
            frappe.msgprint("进行处理");
            
        },
        secondary_action_label: "取消",

        post_init() {
            log("wtt post_init, this:", this);
        }
    });
    // 寻找用户，和拥有的工序，设置搜索框，包含所需的工序


    window.sps = sps;
    window.spd = sps.dialog;
    
}

// bbl.ui.SpmSelectDialog = class SpmSelectDialog {
class SpmSelectDialog {
    constructor(opts) {
		/* Options: doctype, target, setters, get_query, action, add_filters_group, data_fields, primary_action_label, columns */
		Object.assign(this, opts);
		this.for_select = this.doctype == "[Select]";
		if (!this.for_select) {
			frappe.model.with_doctype(this.doctype, () => this.init());
		} else {
			this.init();
		}
        this.post_init && this.post_init();
	}


	init() {
		this.page_length = 20;
		this.child_page_length = 20;
		this.fields = this.get_fields();

		this.make();
        this.add_custom_filter_group();

	}

	get_fields() {
		const primary_fields = this.get_primary_filters();
		const result_fields = this.get_result_fields();
		const data_fields = this.get_data_fields();
		const child_selection_fields = this.get_child_selection_fields();

		return [...primary_fields, ...result_fields, ...data_fields, ...child_selection_fields];
	}

	get_result_fields() {
		const show_next_page = () => {
			this.page_length += 20;
			this.get_results();
		};
		return [
			{
				fieldtype: "HTML",
				fieldname: "results_area",
			},
			{
				fieldtype: "Button",
				fieldname: "more_btn",
				label: __("More"),
				click: show_next_page.bind(this),
			},
		];
	}

	get_data_fields() {
		if (this.data_fields && this.data_fields.length) {
			// Custom Data Fields
			return [{ fieldtype: "Section Break" }, ...this.data_fields];
		} else {
			return [];
		}
	}

	get_child_selection_fields() {
		const fields = [];
		if (this.allow_child_item_selection && this.child_fieldname) {
			const show_more_child_results = () => {
				this.child_page_length += 20;
				this.show_child_results();
			};
			fields.push({ fieldtype: "HTML", fieldname: "child_selection_area" });
			fields.push({
				fieldtype: "Button",
				fieldname: "more_child_btn",
				hidden: 1,
				label: __("More"),
				click: show_more_child_results.bind(this),
			});
		}
		return fields;
	}

	make() {
		let doctype_plural = __(this.doctype).plural();
		let title = __("Select {0}", [this.for_select ? __("value") : doctype_plural]);

		this.dialog = new frappe.ui.Dialog({
			title: title,
			fields: this.fields,
			size: this.size,
			primary_action_label: this.primary_action_label || __("Get Items"),
			secondary_action_label: this.secondary_action_label || __("Make {0}", [__(this.doctype)]),
			primary_action: () => {
				let filters_data = this.get_custom_filters();
				const data_values = cur_dialog.get_values(); // to pass values of data fields
				const filtered_children = this.get_selected_child_names();
				const selected_documents = [
					...this.get_checked_values(),
					...this.get_parent_name_of_selected_children(),
				];
				this.action(selected_documents, {
					...this.args,
					...data_values,
					...filters_data,
					filtered_children,
				});
			},
			// secondary_action: this.make_new_document.bind(this),
			secondary_action: () => {cur_dialog.hide();},
		});

		if (this.add_filters_group) {
			this.make_filter_area();
		}

		this.args = {};

		this.setup_results();
		this.bind_events();
		this.get_results();
		this.dialog.show();
	}

	make_new_document(e) {
		// If user wants to close the modal
		if (e) {
            log("e1", e)
			this.set_route_options();
			// frappe.new_doc(this.doctype, true);
		}
	}

	set_route_options() {
		// set route options to get pre-filled form fields
		frappe.route_options = {};
		if (Array.isArray(this.setters)) {
			for (let df of this.setters) {
				frappe.route_options[df.fieldname] =
					this.dialog.fields_dict[df.fieldname].get_value() || undefined;
			}
		} else {
			Object.keys(this.setters).forEach((setter) => {
				frappe.route_options[setter] =
					this.dialog.fields_dict[setter].get_value() || undefined;
			});
		}
	}

	setup_results() {
		this.$parent = $(this.dialog.body);
		this.$wrapper = this.dialog.fields_dict.results_area.$wrapper
			.append(`<div class="results my-3"
			style="border: 1px solid #d1d8dd; border-radius: 3px; height: 300px; overflow: auto;"></div>`);

		this.$results = this.$wrapper.find(".results");
		this.$results.append(this.make_list_row());
	}

	show_child_results() {
		this.get_child_result().then((r) => {
			this.child_results = r.message || [];
			this.render_child_datatable();

			this.$wrapper.addClass("hidden");
			this.$child_wrapper.removeClass("hidden");
			this.dialog.fields_dict.more_btn.$wrapper.hide();
		});
	}

	is_child_selection_enabled() {
		return this.dialog.fields_dict["allow_child_item_selection"]?.get_value();
	}

	toggle_child_selection() {
		if (this.is_child_selection_enabled()) {
			this.show_child_results();
		} else {
			this.child_results = [];
			this.get_results();
			this.$wrapper.removeClass("hidden");
			this.$child_wrapper.addClass("hidden");
		}
	}

	render_child_datatable() {
		if (!this.child_datatable) {
			this.setup_child_datatable();
		} else {
			setTimeout(() => {
				this.child_datatable.rowmanager.checkMap = [];
				this.child_datatable.refresh(this.get_child_datatable_rows());
				this.$child_wrapper.find(".dt-scrollable").css("height", "300px");
				this.$child_wrapper.find(".dt-scrollable").css("overflow-y", "scroll");
			}, 500);
		}
	}

	get_child_datatable_columns() {
		const parent = this.doctype;
		return [parent, ...this.child_columns].map((d) => ({
			name: frappe.unscrub(d),
			editable: false,
		}));
	}

	get_child_datatable_rows() {
		if (this.child_results.length > this.child_page_length) {
			this.dialog.fields_dict.more_child_btn.toggle(true);
		} else {
			this.dialog.fields_dict.more_child_btn.toggle(false);
		}
		return this.child_results
			.slice(0, this.child_page_length)
			.map((d) => Object.values(d).slice(1)); // slice name field
	}

	setup_child_datatable() {
		const header_columns = this.get_child_datatable_columns();
		const rows = this.get_child_datatable_rows();
		this.$child_wrapper = this.dialog.fields_dict.child_selection_area.$wrapper;
		this.$child_wrapper.addClass("my-3");

		this.child_datatable = new frappe.DataTable(this.$child_wrapper.get(0), {
			columns: header_columns,
			data: rows,
			layout: "fluid",
			inlineFilters: true,
			serialNoColumn: false,
			checkboxColumn: true,
			cellHeight: 35,
			noDataMessage: __("No Data"),
			disableReorderColumn: true,
		});
		this.$child_wrapper.find(".dt-scrollable").css("height", "300px");
	}

	get_primary_filters() {
		let fields = [];

		let columns = new Array(3);

		// Hack for three column layout
		// To add column break
		columns[0] = [
			{
				fieldtype: "Data",
				label: __("Name"),
				fieldname: "search_term",
			},
		];
		columns[1] = [];
		columns[2] = [];

		if ($.isArray(this.setters)) {
			this.setters.forEach((setter, index) => {
				columns[(index + 1) % 3].push(setter);
			});
		} else {
			Object.keys(this.setters).forEach((setter, index) => {
				let df_prop = frappe.meta.docfield_map[this.doctype][setter];

				// Index + 1 to start filling from index 1
				// Since Search is a standrd field already pushed
				columns[(index + 1) % 3].push({
					fieldtype: df_prop.fieldtype,
					label: df_prop.label,
					fieldname: setter,
					options: df_prop.options,
					default: this.setters[setter],
				});
			});
		}

		// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/seal
		if (Object.seal) {
			Object.seal(columns);
			// now a is a fixed-size array with mutable entries
		}

		if (this.allow_child_item_selection) {
			this.child_doctype = frappe.meta.get_docfield(
				this.doctype,
				this.child_fieldname
			).options;
			columns[0].push({
				fieldtype: "Check",
				label: __("Select {0}", [__(this.child_doctype)]),
				fieldname: "allow_child_item_selection",
				onchange: this.toggle_child_selection.bind(this),
			});
		}

		fields = [
			...columns[0],
			{ fieldtype: "Column Break" },
			...columns[1],
			{ fieldtype: "Column Break" },
			...columns[2],
			{ fieldtype: "Section Break", fieldname: "primary_filters_sb" },
		];

		if (this.add_filters_group) {
			fields.push({
				fieldtype: "HTML",
				fieldname: "filter_area",
			});
		}

		return fields;
	}

	make_filter_area() {
		this.filter_group = new frappe.ui.FilterGroup({
			parent: this.dialog.get_field("filter_area").$wrapper,
			doctype: this.doctype,
			on_change: () => {
				if (this.is_child_selection_enabled()) {
					this.show_child_results();
				} else {
					this.get_results();
				}
			},
		});
		// 'Apply Filter' breaks since the filers are not in a popover
		// Hence keeping it hidden
		this.filter_group.wrapper.find(".apply-filters").hide();
	}

	get_custom_filters() {
		if (this.add_filters_group && this.filter_group) {
			return this.filter_group.get_filters().reduce((acc, filter) => {
				return Object.assign(acc, {
					[filter[1]]: [filter[2], filter[3]],
				});
			}, {});
		} else {
			return {};
		}
	}

	bind_events() {
		let me = this;

		this.$results.on("click", ".list-item-container", function (e) {
			if (!$(e.target).is(":checkbox") && !$(e.target).is("a")) {
				$(this).find(":checkbox").trigger("click");
			}
		});

		this.$results.on("click", ".list-item--head :checkbox", (e) => {
			this.$results
				.find(".list-item-container .list-row-check")
				.prop("checked", $(e.target).is(":checked"));
		});

		this.$parent.find(".input-with-feedback").on("change", () => {
			frappe.flags.auto_scroll = false;
			if (this.is_child_selection_enabled()) {
				this.show_child_results();
			} else {
				this.get_results();
			}
		});

		this.$parent.find('[data-fieldtype="Data"]').on("input", () => {
			var $this = $(this);
			clearTimeout($this.data("timeout"));
			$this.data(
				"timeout",
				setTimeout(function () {
					frappe.flags.auto_scroll = false;
					if (me.is_child_selection_enabled()) {
						me.show_child_results();
					} else {
						me.empty_list();
						me.get_results();
					}
				}, 300)
			);
		});
	}

	get_parent_name_of_selected_children() {
		if (!this.child_datatable || !this.child_datatable.datamanager.rows.length) return [];

		let parent_names = this.child_datatable.rowmanager.checkMap.reduce(
			(parent_names, checked, index) => {
				if (checked == 1) {
					const parent_name = this.child_results[index].parent;
					if (!parent_names.includes(parent_name)) {
						parent_names.push(parent_name);
					}
				}
				return parent_names;
			},
			[]
		);

		return parent_names;
	}

	get_selected_child_names() {
		if (!this.child_datatable || !this.child_datatable.datamanager.rows.length) return [];

		let checked_names = this.child_datatable.rowmanager.checkMap.reduce(
			(checked_names, checked, index) => {
				if (checked == 1) {
					const child_row_name = this.child_results[index].name;
					checked_names.push(child_row_name);
				}
				return checked_names;
			},
			[]
		);

		return checked_names;
	}

	get_checked_values() {
		// Return name of checked value.
		return this.$results
			.find(".list-item-container")
			.map(function () {
				if ($(this).find(".list-row-check:checkbox:checked").length > 0) {
					return $(this).attr("data-item-name");
				}
			})
			.get();
	}

	get_checked_items() {
		// Return checked items with all the column values.
		let checked_values = this.get_checked_values();
		return this.results.filter((res) => checked_values.includes(res.name));
	}

	get_datatable_columns() {
		// if (this.get_query && this.get_query().query && this.columns) return this.columns;

		// if (Array.isArray(this.setters))
		// 	// return ["name", ...this.setters.map((df) => df.fieldname)];
		// 	return [ ...this.setters.map((df) => df.fieldname)];

		// return ["name", ...Object.keys(this.setters)];.
        return this.columns;
	}

	make_list_row(result = {}) {
		var me = this;
		// Make a head row by default (if result not passed)
		let head = Object.keys(result).length === 0;

		let contents = ``;
		this.get_datatable_columns().forEach(function (column) {
			contents += `<div class="list-item__content ellipsis">
				${
					head
						? `<span class="ellipsis text-muted" title="${__(
								frappe.model.unscrub(column)
						  )}">${__(frappe.model.unscrub(column))}</span>`
						: column !== "name"
						? `<span class="ellipsis result-row" title="${__(
								result[column] || ""
						  )}">${__(result[column] || "")}</span>`
						: `<a href="${
								"/app/" + frappe.router.slug(me.doctype) + "/" + result[column] ||
								""
						  }" class="list-id ellipsis" title="${__(result[column] || "")}">
							${__(result[column] || "")}</a>`
				}
			</div>`;
		});

		let $row = $(`<div class="list-item">
			<div class="list-item__content" style="flex: 0 0 10px;">
				<input type="checkbox" class="list-row-check" data-item-name="${result.name}" ${
			result.checked ? "checked" : ""
		}>
			</div>
			${contents}
		</div>`);

		head
			? $row.addClass("list-item--head")
			: ($row = $(
					`<div class="list-item-container" data-item-name="${result.name}"></div>`
			  ).append($row));

		return $row;
	}

	render_result_list(results, more = 0, empty = true) {
		var me = this;
		var more_btn = me.dialog.fields_dict.more_btn.$wrapper;

		// Make empty result set if filter is set
		if (!frappe.flags.auto_scroll && empty) {
			this.empty_list();
		}
		more_btn.hide();
		$(".modal-dialog .list-item--head").css("z-index", 1);

		if (results.length === 0) return;
		if (more) more_btn.show();

		let checked = this.get_checked_values();

		results
			.filter((result) => !checked.includes(result.name))
			.forEach((result) => {
				me.$results.append(me.make_list_row(result));
			});

		this.$results.find(".list-item--head").css("z-index", 1);

		if (frappe.flags.auto_scroll) {
			this.$results.animate({ scrollTop: me.$results.prop("scrollHeight") }, 500);
		}
	}

	empty_list() {
		// Store all checked items
		let checked = this.get_checked_items().map((item) => {
			return {
				...item,
				checked: true,
			};
		});

		// Remove **all** items
		this.$results.find(".list-item-container").remove();

		// Rerender checked items
		this.render_result_list(checked, 0, false);
	}

	get_filters_from_setters() {
		let me = this;
		let filters = (this.get_query ? this.get_query().filters : {}) || {};
		let filter_fields = [];

		if ($.isArray(this.setters)) {
			for (let df of this.setters) {
                let value = me.dialog.fields_dict[df.fieldname].get_value();
                if (df.fieldtype == "Data" && value) {
					filters[df.fieldname] = ["like", "%" + value + "%"];
                } else {
					filters[df.fieldname] = value || undefined;
					me.args[df.fieldname] = filters[df.fieldname];
					filter_fields.push(df.fieldname);                    
                }
				// filters[df.fieldname] = me.dialog.fields_dict[df.fieldname].get_value();
				// 	me.dialog.fields_dict[df.fieldname].get_value() || undefined;
				// me.args[df.fieldname] = filters[df.fieldname];
				// filter_fields.push(df.fieldname);
			}
		} else {
			Object.keys(this.setters).forEach(function (setter) {
				var value = me.dialog.fields_dict[setter].get_value();
				if (me.dialog.fields_dict[setter].df.fieldtype == "Data" && value) {
					filters[setter] = ["like", "%" + value + "%"];
				} else {
					filters[setter] = value || undefined;
					me.args[setter] = filters[setter];
					filter_fields.push(setter);
				}
			});
		}

		return [filters, filter_fields];
	}

	get_args_for_search() {
		let [filters, filter_fields] = this.get_filters_from_setters();

		let custom_filters = this.get_custom_filters();
		Object.assign(filters, custom_filters);

		return {
			doctype: this.doctype,
			txt: this.dialog.fields_dict["search_term"].get_value(),
			filters: filters,
			filter_fields: filter_fields,
			page_length: this.page_length + 5,
			query: this.get_query ? this.get_query().query : "",
			as_dict: 1,
		};
	}

	async perform_search(args) {
		const res = await frappe.call({
			type: "GET",
			method: "frappe.desk.search.search_widget",
			no_spinner: true,
			args: args,
		});
		const more = res.message.length && res.message.length > this.page_length ? 1 : 0;

		return [res.message, more];
	}

	async get_results() {
		const args = this.get_args_for_search();
		let [results, more] = await this.perform_search(args);

		if (more) {
			results = results.splice(0, this.page_length);
		}

		this.results = [];
		if (results.length) {
			results.forEach((result) => {
				result.checked = 0;
				this.results.push(result);
			});
		}
		this.render_result_list(this.results, more);
	}

	async get_filtered_parents_for_child_search() {
		const parent_search_args = this.get_args_for_search();
		parent_search_args.filter_fields = ["name"];
		const [results, _] = await this.perform_search(parent_search_args);

		let parent_names = [];
		if (results.length) {
			parent_names = results.map((v) => v.name);
		}
		return parent_names;
	}

	async add_parent_filters(filters) {
		const parent_names = await this.get_filtered_parents_for_child_search();
		if (parent_names.length) {
			filters.push(["parent", "in", parent_names]);
		}
	}

	add_custom_child_filters(filters) {
		if (this.add_filters_group && this.filter_group) {
			this.filter_group.get_filters().forEach((filter) => {
				if (filter[0] == this.child_doctype) {
					filters.push([filter[1], filter[2], filter[3]]);
				}
			});
		}
	}

	async get_child_result() {
		let filters = [["parentfield", "=", this.child_fieldname]];

		await this.add_parent_filters(filters);
		this.add_custom_child_filters(filters);

		return frappe.call({
			method: "frappe.client.get_list",
			args: {
				doctype: this.child_doctype,
				filters: filters,
				fields: ["name", "parent", ...this.child_columns],
				parent: this.doctype,
				limit_page_length: this.child_page_length + 5,
				order_by: "parent",
			},
		});
	}

    add_custom_filter_group() {
		if (this.add_filters_group && this.filter_group) {
			// this.filter_group.add_filter(this.doctype, "name", "Link", "");
            frappe.db.get_list("Job Post", {
                filters: {
                    parent: frappe.session.user_fullname,
                },
                fields: ["job_post"],
                pluck: "job_post",
                parent_doctype: "Employee Jobs",
            }).then(r => {
                log("add filter :", r);
                let date1 = frappe.datetime.get_today();
                date1 = frappe.datetime.add_days(date1, -5);
                this.filter_group.add_filter(this.doctype, "for_date", ">=", date1);
                if (r.length)
                    this.filter_group.add_filter(this.doctype, "operation", "in", r);
                
                setTimeout(() => {
                    this.filter_group.on_change()
                }, 0);
            });
		}
    }
};