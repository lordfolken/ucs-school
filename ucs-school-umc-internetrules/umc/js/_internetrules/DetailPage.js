/*
 * Copyright 2011 Univention GmbH
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
/*global console MyError dojo dojox dijit umc */

dojo.provide("umc.modules._internetrules.DetailPage");

dojo.require("umc.dialog");
dojo.require("umc.i18n");
dojo.require("umc.store");
dojo.require("umc.tools");
dojo.require("umc.widgets.Form");
dojo.require("umc.widgets.Page");
dojo.require("umc.widgets.StandbyMixin");

dojo.declare("umc.modules._internetrules.DetailPage", [ umc.widgets.Page, umc.widgets.StandbyMixin, umc.i18n.Mixin ], {
	// summary:
	//		This class represents the detail view of our dummy module.

	// reference to the module's store object
	moduleStore: null,

	// use i18n information from umc.modules.internetrules
	i18nClass: 'umc.modules.internetrules',

	// internal reference to the formular containing all form widgets of an UDM object
	_form: null,

	postMixInProperties: function() {
		this.inherited(arguments);

		// set the opacity for the standby animation
		this.standbyOpacity = 1;

		// get the module store
		this.moduleStore = umc.store.getModuleStore('id', 'internetrules');

		// set the page header
		this.headerText = this._('Edit internet rule');

		// configure buttons for the footer of the detail page
		this.footerButtons = [{
			name: 'submit',
			label: this._('Save'),
			callback: dojo.hitch(this, function() {
				this._save(this._form.gatherFormValues());
			})
		}, {
			name: 'back',
			label: this._('Back to overview'),
			callback: dojo.hitch(this, 'onClose')
		}];
	},

	buildRendering: function() {
		this.inherited(arguments);
		this.renderDetailPage();
	},

	renderDetailPage: function() {
		// render the form containing all detail information that may be edited

		// specify all widgets
		var widgets = [{
			type: 'TextBox',
			name: 'name',
			label: this._('Name'),
			description: this._('The name of the rule')
		}, {
			type: 'ComboBox',
			name: 'type',
			label: this._('Rule type'),
			description: this._('A <i>whitelist</i> defines the list of domains that can be browsed to, the access to all other domains will be blocked. A <i>blacklist</i> allows access to all existing domains, only the access to the specified list of domains will be denied.'),
			staticValues: [{
				id: 'whitelist',
				label: this._('Whitelist')
			}, {
				id: 'blacklist',
				label: this._('Blacklist')
			}]
		}, {
			type: 'ComboBox',
			name: 'priority',
			label: this._('Priority'),
			description: this._('The priority allows to define an order in which a set of rules will be applied. A rule with a higher priority will overwrite rules with lower priorities.'),
			value: '5',
			staticValues: [
				{ id: '0', label: this._('0 (low)') },
				'1', '2', '3', '4',
				{ id: '5', label: this._('5 (average)') },
				'6', '7', '8', '9',
				{ id: '10', label: this._('10 (high)') }
			]
		}, {
			type: 'CheckBox',
			name: 'wlan',
			label: this._('WLAN authentification enabled')
		}, {
			type: 'MultiInput',
			name: 'domains',
			description: this._('A list of internet domains, such as wikipedia.org, youtube.com. It is recommended to specify only the last part of a domain, i.e., wikipedia.org instead of www.wikipedia.org.'),
			subtypes: [{
				type: 'TextBox'
			}],
			label: this._('Web domains (e.g., wikipedia.org, facebook.com)')
		}];

		// specify the layout... additional dicts are used to group form elements
		// together into title panes
		var layout = [{
			label: this._('Rule properties'),
			layout: [ 'name', 'type' ]
		}, {
			label: this._('Web domain list'),
			layout: [ 'domains' ]
		}, {
			label: this._('Advanced properties'),
			layout: [ 'wlan', 'priority' ]
		}];

		// create the form
		this._form = new umc.widgets.Form({
			widgets: widgets,
			layout: layout,
			moduleStore: this.moduleStore,
			// alows the form to be scrollable when the window size is not large enough
			scrollable: true
		});

		// add form to page... the page extends a BorderContainer, by default
		// an element gets added to the center region
		this.addChild(this._form);

		// hook to onSubmit event of the form
		this.connect(this._form, 'onSubmit', '_save');
	},

	_save: function(values) {
		this.standby(true);
		this._form.save().then(dojo.hitch(this, function(result) {
			this.standby(false);
			if (result && !result.success) {
				// display error message
				umc.dialog.alert(result.details);
				return;
			}
			this.onClose();
			return;
		}), dojo.hitch(this, function(error) {
			// server error
			this.standby(false);
		}));
	},

	load: function(id) {
		// during loading show the standby animation
		this.standby(true);
		this._loadedRuleName = id;

		// load the object into the form... the load method returns a
		// dojo.Deferred object in order to handel asynchronity
		this._form.load(id).then(dojo.hitch(this, function() {
			// done, switch of the standby animation
			this.standby(false);
		}), dojo.hitch(this, function() {
			// error handler: switch of the standby animation
			// error messages will be displayed automatically
			this.standby(false);
		}));

		// set focus
		this._form.getWidget('name').focus();
	},

	reset: function() {
		// clear form values and set defaults
		this._form.clearFormValues();
		this._form.setFormValues({
			priority: '5',
			type: 'whitelist'
		});
		this._loadedRuleName = null;

		// set focus
		this._form.getWidget('name').focus();
	},

	onClose: function() {
		// event stub
	}
});



