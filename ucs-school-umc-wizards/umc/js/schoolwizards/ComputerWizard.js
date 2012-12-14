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

/*global define*/

define([
	"dojo/_base/declare",
	"umc/tools",
	"umc/widgets/TextBox",
	"umc/widgets/ComboBox",
	"umc/modules/schoolwizards/Wizard",
	"umc/i18n!/umc/modules/schoolwizards"
], function(declare, tools, TextBox, ComboBox, Wizard, _) {

	return declare("umc.modules.schoolwizards.ComputerWizard", [ Wizard ], {

		createObjectCommand: 'schoolwizards/computers/create',

		constructor: function() {
			this.pages = [{
				name: 'general',
				headerText: this.description,
				helpText: _('Specify the computer type.'),
				widgets: [{
					type: ComboBox,
					name: 'school',
					label: _('School'),
					dynamicValues: 'schoolwizards/schools',
					autoHide: true
				}, {
					type: ComboBox,
					name: 'type',
					label: _('Type'),
					staticValues: [{
						id: 'windows',
						label: _('Windows system')
					}, {
						id: 'ipmanagedclient',
						label: _('Device with IP address')
					}]
				}],
				layout: [['school'], ['type']]
			}, {
				name: 'computer',
				headerText: this.description,
				helpText: _('Enter details to create a new computer.'),
				widgets: [{
					type: TextBox,
					name: 'name',
					label: _('Name'),
					required: true
				}, {
					type: TextBox,
					name: 'ipAddress',
					label: _('IP address'),
					required: true
				}, {
					type: TextBox,
					name: 'subnetMask',
					label: _('Subnet mask'),
					value: '255.255.255.0'
				}, {
					type: TextBox,
					name: 'mac',
					label: _('MAC address'),
					required: true
				}, {
					type: TextBox,
					name: 'inventoryNumber',
					label: _('Inventory number')
				}],
				layout: [['name'],
			         	 ['ipAddress', 'subnetMask'],
			         	 ['mac'],
			         	 ['inventoryNumber']]
			}];
		},

		restart: function() {
			tools.forIn(this.getPage('computer')._form._widgets, function(iname, iwidget) {
				iwidget.reset();
			});
			this.inherited(arguments);
		},

		addNote: function() {
			var name = this.getWidget('computer', 'name').get('value');
			var message = _('Computer "%s" has been successfully created. Continue to create another computer or press "Cancel" to close this wizard.', name);
			this.getPage('computer').clearNotes();
			this.getPage('computer').addNote(message);
		}
	});

});
