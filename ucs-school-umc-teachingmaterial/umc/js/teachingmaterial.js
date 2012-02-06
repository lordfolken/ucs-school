/*
 * Copyright 2012 Univention GmbH
 *
 * http://www.univention.de/
 *
 * All rights reserved.
 *
 * The source code of this program is made available
 * under the terms of the GNU Affero General Public License version 3
 * (GNU AGPL V3) as published by the Free Software Foundation.
 *
 * Binary versions of this program provided by Univention to you as
 * well as other copyrighted, protected or trademarked materials like
 * Logos, graphics, fonts, specific documentations and configurations,
 * cryptographic keys etc. are subject to a license agreement between
 * you and Univention and not subject to the GNU AGPL V3.
 *
 * In the case you use this program under the terms of the GNU AGPL V3,
 * the program is provided in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public
 * License with the Debian GNU/Linux or Univention distribution in file
 * /usr/share/common-licenses/AGPL-3; if not, see
 * <http://www.gnu.org/licenses/>.
 */
/*global console dojo dojox dijit umc */

dojo.provide("umc.modules.teachingmaterial");

dojo.require("umc.dialog");
dojo.require("umc.i18n");
dojo.require("umc.tools");
dojo.require("umc.widgets.ExpandingTitlePane");
dojo.require("umc.widgets.Grid");
dojo.require("umc.widgets.Module");
dojo.require("umc.widgets.Page");
dojo.require("umc.widgets.SearchForm");

dojo.require("umc.modules._teachingmaterial.DetailPage");

dojo.declare("umc.modules.teachingmaterial", [ umc.widgets.Module, umc.i18n.Mixin ], {
	// summary:
	//		Template module to ease the UMC module development.
	// description:
	//		This module is a template module in order to aid the development of
	//		new modules for Univention Management Console.

	// the property field that acts as unique identifier for the object
	idProperty: 'id',

	// internal reference to the grid
	_grid: null,

	// internal reference to the search page
	_searchPage: null,

	// internal reference to the detail page for editing an object
	_detailPage: null,

	postMixInProperties: function() {
		// is called after all inherited properties/methods have been mixed
		// into the object (originates from dijit._Widget)

		// it is important to call the parent's postMixInProperties() method
		this.inherited(arguments);

		// Set the opacity for the standby animation to 100% in order to mask
		// GUI changes when the module is opened. Call this.standby(true|false)
		// to enabled/disable the animation.
		this.standbyOpacity = 1;
	},

	buildRendering: function() {
		// is called after all DOM nodes have been setup
		// (originates from dijit._Widget)

		// it is important to call the parent's postMixInProperties() method
		this.inherited(arguments);

		// render the page containing search form and grid
		this.renderSearchPage();
	},

	renderSearchPage: function(containers, superordinates) {
		// render all GUI elements for the search formular and the grid

		// setup search page and its main widgets
		// for the styling, we need a title pane surrounding search form and grid
		this._searchPage = new umc.widgets.Page({
			headerText: this.description,
			helpText: ''
		});

		// umc.widgets.Module is also a StackContainer instance that can hold
		// different pages (see also umc.widgets.TabbedModule)
		this.addChild(this._searchPage);

		// umc.widgets.ExpandingTitlePane is an extension of dijit.layout.BorderContainer
		var titlePane = new umc.widgets.ExpandingTitlePane({
			title: this._('Search results')
		});
		this._searchPage.addChild(titlePane);


		//
		// data grid
		//

		// define grid actions
		var actions = [{
			name: 'add',
			label: this._('Add object'),
			description: this._('Create a new object'),
			iconClass: 'umcIconAdd',
			isContextAction: false,
			isStandardAction: true,
			callback: dojo.hitch(this, '_dummy')
		}, {
			name: 'edit',
			label: this._('Edit'),
			description: this._('Edit the selected object'),
			iconClass: 'umcIconEdit',
			isStandardAction: true,
			isMultiAction: false,
			callback: dojo.hitch(this, '_editObject')
		}, {
			name: 'distribute',
			label: dojo.hitch(this, function(item) { 
				if (!item) {
					return this._('Distribution');
				}
				return !item.distributed ? this._('distribute') : this._('collect');
			}),
			description: this._('Distribute project files to pupils'),
			isStandardAction: true,
			isMultiAction: false,
			callback: dojo.hitch(this, '_dummy')
		}, {
			name: 'close',
			label: this._('Close'),
			description: this._('Close the selected material projects'),
			isStandardAction: true,
			isMultiAction: true,
			iconClass: 'umcIconDelete',
			callback: dojo.hitch(this, '_dummy')
		}];

		// define the grid columns
		var columns = [{
			name: 'description',
			label: this._('Description'),
			width: 'auto'
		}, {
			name: 'owner',
			label: this._('Owner'),
			width: '175px'
		}, {
			name: 'nusers',
			label: this._('#Users'),
			width: 'adjust'
		}, {
			name: 'nfiles',
			label: this._('#Files'),
			width: 'adjust'
		}];

		// generate the data grid
		this._grid = new umc.widgets.Grid({
			// property that defines the widget's position in a dijit.layout.BorderContainer,
			// 'center' is its default value, so no need to specify it here explicitely
			// region: 'center',
			actions: actions,
			// defines which data fields are displayed in the grids columns
			columns: columns,
			// a generic UMCP module store object is automatically provided
			// as this.moduleStore (see also umc.store.getModuleStore())
			moduleStore: this.moduleStore,
			// initial query
			query: { }
		});

		// add the grid to the title pane
		titlePane.addChild(this._grid);


		//
		// search form
		//

		// add remaining elements of the search form
		var widgets = [{
			type: 'ComboBox',
			name: 'filter',
			label: 'Filter',
			staticValues: [
				{ id: 'private', label: this._('Only own projects') },
				{ id: 'all', label: this._('All projects') }
			]
		}, {
			type: 'TextBox',
			name: 'pattern',
			description: this._('Specifies the substring pattern which is searched for in the projects'),
			label: this._('Search pattern')
		}];

		// the layout is an 2D array that defines the organization of the form elements...
		// here we arrange the form elements in one row and add the 'submit' button
		var layout = [
			[ 'filter', 'pattern', 'submit' ]
		];

		// generate the search form
		this._searchForm = new umc.widgets.SearchForm({
			// property that defines the widget's position in a dijit.layout.BorderContainer
			region: 'top',
			widgets: widgets,
			layout: layout,
			onSearch: dojo.hitch(this, function(values) {
				// call the grid's filter function
				// (could be also done via dojo.connect() and dojo.disconnect() )
				this._grid.filter(values);
			})
		});

		// add search form to the title pane
		titlePane.addChild(this._searchForm);

		//
		// conclusion
		//

		// we need to call page's startup method manually as all widgets have
		// been added to the page container object
		this._searchPage.startup();

		// create a DetailPage instance
		this._detailPage = new umc.modules._teachingmaterial.DetailPage({
			moduleStore: this.moduleStore
		});
		this.addChild(this._detailPage);

		// connect to the onClose event of the detail page... we need to manage
		// visibility of sub pages here
		// ... this.connect() will destroy signal handlers upon widget
		// destruction automatically
		this.connect(this._detailPage, 'onClose', function() {
			this.selectChild(this._searchPage);
		});
	},

	_dummy: function() {
		umc.dialog.alert(this._('Feature not yet implemented'));
	},

	_editObject: function(ids, items) {
		if (ids.length != 1) {
			// should not happen
			return;
		}

		this.selectChild(this._detailPage);
		this._detailPage.load(ids[0]);
	}
});



