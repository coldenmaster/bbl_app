frappe.pages['wt-page'].on_page_load = function(wrapper) {
	var page = frappe.ui.make_app_page({
		parent: wrapper,
		title: 'wt测试页面',
		single_column: true
	});
    console.log('wt-page on_page_load 1');

    wrapper.wt_rt_chart = new bbl.WtRtChart(wrapper);


	frappe.breadcrumbs.add("Manufacturing");
    console.log('wt-page on_page_load end 99');
}

bbl.WtRtChart = class WtRtChart {
	constructor(wrapper) {
		var me = this;
		// 0 setTimeout hack - this gives time for canvas to get width and height
		setTimeout(function () {
			me.setup(wrapper);
			me.get_data();
            me.draw_chart(wrapper);
		}, 0);
	}


	setup(wrapper) {
        log('wt_rt_chart setup', wrapper);
        let chart_view = $('<div id="wt_rt_chart">wt_rt_chart</div>');
        let chart_container = $(wrapper).find(".page-content")
        chart_container.empty()
        chart_container.append(chart_view);
    }

    get_data() {
        log('wt_rt_chart get_data');
    }

    draw_chart(wrapper) {
        log('wt_rt_chart draw_chart');


        const chart = new frappe.ui.RealtimeChart(
            '#wt_rt_chart', 
            'wt_rt_data',
            30,
            {
                // parent: wrapper,
                // parent: $('#wt_rt_chart'),
                title: '实时数据示例',
                data: {
                    labels: [
                        "12am-3am", "3am-6pm", "6am-9am", "9am-12am",
                        "12pm-3pm", "3pm-6pm", "6pm-9pm", "9am-12am"
                    ],
                    datasets: [
                        {
                            // name: "Some Data", chartType: "bar",
                            // name: "Some Data", 
                            values: [25, 40, 30, 35, 8, 52, 17, -4]
                        },
                        {
                            // name: "Another Set", chartType: "bar",
                            // name: "Another Set", 
                            values: [32, 22, 25, 50, -10, 15, 18, 27, 14]
                        },
                        {
                            // name: "Another Set", chartType: "line",
                            name: "Another Set3", 
                            values: [ 50, -10, 15, 18, 32, 27, 14, 23]
                        },
                        {
                            // name: "Another Set4", chartType: "bar",
                            // name: "Another Set4", 
                            values: [50, 25, -10, 15, 18, 32, 27, 14]
                        }
                    ],
                    yMarkers: [
                        {
                            label: "Marker", 
                            value: 42, 
                            options: {
                                labelPos: 'left'
                            }
                        }
                    ],
                    yRegions: [{ label: "Region", start: 10, end: 30, options: {}, color: 'rgba(0, 150, 0, 0.2)' }],
                    xRegions: [{ label: "Regionx", start: "3am-6pm", end: "3pm-6pm", options: {} }],
                },
                // type: 'axis-mixed', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
                type: 'line', // or 'bar', 'line', 'scatter', 'pie', 'percentage' donut
                height: 500,
                // colors: ['#7cd6fd', '#743ee2'],
                colors: ['red', 'green', 'blue', 'yellow'],
                lineOptions: {
                    // radius: 5,
                    // width: 3,
                    // regionFill: 1,
                    dotSize: 8,
                    // hideLine: 1,
                    showDots: 1,
                    heatline: 1,
                    // spline: 1,
                },
                isNavigalbe: true,
                barOptions: {
                    // spaceRatio: 0.8,
                    // stacked: 1,
                    height: 100,

                },
                axisOptions: {
                    // xAxisMode: 'tick',
                    // yAxisMode: 'tick',
                    xIsSeries: true,
                },
                maxSlices: 7,
                tooltipOptions: {
                    formatTooltipX: d => (d + '时间段').toUpperCase(),
                    formatTooltipY: d => d + ' 帕斯卡',
                },
                valuesOverPoints: 1 // default: 0
            });


        window.wc = chart;
        setInterval(() => {
            const randomValue = Math.floor(Math.random() * 100);
            // chart.addData(randomValue);
        }, 1000)


        // todo 测试热力图
        // var start_time = new Date();
        // let miliseconds_day = 24*60*60*1000;
        // start_time.setTime(start_time.getTime()-(150*miliseconds_day));
        // // 以当前时间为开始向后推150天
        // var end_time = new Date();
        // end_time.setTime(end_time.getTime()+(150*miliseconds_day));
        
        // // 利用JS随机生成一些点用于展示
        // let Points = {};
        // for (var i = 0; i < 100; i++) {
        //     var date_range = (end_time.getTime() - start_time.getTime())/miliseconds_day;
        //     var value_range = 256;
        //     var Rand = Math.random();
        //     var base_time = start_time.getTime();
        //     var rand_time = Math.round(Rand * date_range)*miliseconds_day;
        //     // 需要注意的是上面的运算单位都是毫秒，但绘图需要的单位是秒，所以再转换一下
        //     var tmp_date = Math.round((base_time + rand_time)/1000);
        //     var tmp_date_str = tmp_date.toString();
        //     var tmp_value = Math.round(Rand * value_range);
        //     Points[tmp_date_str] = tmp_value;
        // }

        // let data6 = {
        //     dataPoints:Points,  // 数据
        //     // 如果没有指定起始与结束时间，默认从当前天开始往前推一年
        //     start:start_time,   // 起始时间，是一个JS的Date对象
        //     end:end_time    // 终止时间，一个JSDate对象
        // }
        
        

        // const chart = new frappe.ui.RealtimeChart(
        //     '#wt_rt_chart', 
        //     'wt_rt_data',
        //     10,
        //     {
        //         type: 'heatmap', // or 'bar', 'line', 'scatter', 'pie', 'percentage'
        //         title: 'heatmap示例',
        //         data: data6,
        //         // discreteDomains: 0, // default 1
        //         // colors: ['#ebedf0', '#c0ddf9', '#73b3f3', '#3886e1', '#17459e'] // 默认是Github的绿色
        //     }
        // );


    }

    update_data() {
        // setInterval(() => {
        //     const randomValue = Math.floor(Math.random() * 100);
        //     chart addData(randomValue);
        // }, 1000)
    }

    
}
