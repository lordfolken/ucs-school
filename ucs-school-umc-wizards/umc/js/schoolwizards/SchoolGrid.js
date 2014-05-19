/*
 * Copyright 2014 Univention GmbH
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

/*global define window*/

define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/array",
	"dojo/topic",
	"dojo/Deferred",
	"umc/tools",
	"umc/dialog",
	"umc/widgets/TextBox",
	"umc/modules/schoolwizards/SchoolWizard",
	"umc/modules/schoolwizards/Grid",
	"umc/i18n!umc/modules/schoolwizards"
], function(declare, lang, array, topic, Deferred, tools, dialog, TextBox, SchoolWizard, Grid, _) {

	return declare("umc.modules.schoolwizards.SchoolGrid", [Grid], {

		headerText: _('Management of schools'),
		helpText: '',
		objectNamePlural: _('schools'),
		objectNameSingular: _('school'),
		firstObject: _('the first school'),
		createObjectWizard: SchoolWizard,
		sortFields: ['display_name'],
		singleMasterDeferred: null,

		postMixInProperties: function() {
			this.inherited(arguments);
			this.school = this.$dn$;
			this.singleMasterDeferred = new Deferred();
			this.umcpCommand('schoolwizards/schools/singlemaster').then(lang.hitch(this, function(data) {
				this.singleMasterDeferred.resolve(data.result);
			}));
		},

		getGridColumns: function() {
			return [{
				name: 'display_name',
				label: _('Name of the school')
			}, {
				name: 'name',
				label: _('Internal school ID')
			}];
		},

		getObjectIdName: function(item) {
			return item.display_name;
		},

		createWizard: function(props) {
			var originalArguments = arguments;
			this.standbyDuring(this.singleMasterDeferred);
			this.singleMasterDeferred.then(lang.hitch(this, function(singleMaster) {
				props.singleMaster = singleMaster;
				this.inherited(originalArguments);
			}));
		},

		getGridDeleteAction: function() {
			// it is only possible to delete one OU-school at once
			var action = this.inherited(arguments);
			action.isMultiAction = false;
			return action;
		},

		getSearchWidgets: function() {
			return [{
				type: TextBox,
				name: 'filter',
				label: _('Filter')
			}];
		},

		getSearchLayout: function() {
			return [['filter', 'submit']];
		},

		getDeleteConfirmMessage: function(objects) {
			var school = objects[0];
			var msg = _('Please confirm to delete the school "%(displayName)s" (%(name)s).', {displayName: school.display_name, name: school.name});
			msg += '<br/><br/>';
			msg += '<strong>' + _('Warning') + ':</strong> ';
			msg += _('Deleting this school will also delete every teacher and student.') + '<br/>' + _('This action is cannot be undone.');
			return msg;
		},

		deleteObjects: function(ids, objects) {
			var deferred = this.inherited(arguments);
			deferred.then(lang.hitch(this, function() {
				this.relogin();
			}));
			return deferred;
		},

		relogin: function() {
			// copied from umc/app.js with different wording
			dialog.confirm(_('After deleting a school it is recommended to start with a new session. A list of all schools was saved at the beginning in various places which is now outdated. This may result in (harmless but annoying) error messages. Do you want to logout?'), [{
				label: _('Cancel')
			}, {
				label: _('Logout'),
				'default': true,
				callback: lang.hitch(this, function() {
					topic.publish('/umc/actions', 'session', 'logout');
					tools.closeSession();
					window.location.reload();
				})
			}]);
		}
	});
});
