# -*- coding: utf-8 -*-
#
# Univention UCS@School
"""
Legacy mass import class.
"""
# Copyright 2016 Univention GmbH
#
# http://www.univention.de/
#
# All rights reserved.
#
# The source code of this program is made available
# under the terms of the GNU Affero General Public License version 3
# (GNU AGPL V3) as published by the Free Software Foundation.
#
# Binary versions of this program provided by Univention to you as
# well as other copyrighted, protected or trademarked materials like
# Logos, graphics, fonts, specific documentations and configurations,
# cryptographic keys etc. are subject to a license agreement between
# you and Univention and not subject to the GNU AGPL V3.
#
# In the case you use this program under the terms of the GNU AGPL V3,
# the program is provided in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU Affero General Public License for more details.
#
# You should have received a copy of the GNU Affero General Public
# License with the Debian GNU/Linux or Univention distribution in file
# /usr/share/common-licenses/AGPL-3; if not, see
# <http://www.gnu.org/licenses/>.

from univention.admin.uexceptions import noObject
from ucsschool.importer.mass_import.user_import import UserImport


class LegacyUserImport(UserImport):
	def detect_users_to_delete(self):
		"""
		Find difference between source database and UCS user database.
		Appends ImportUsers to delete to self.imported_users[type].

		:return list: ImportUsers to delete with record_uid and source_uid set
		"""
		# Easy - it was written in the CSV file and is already stored in user.action.
		return [user for user in self.imported_users if user.action == "D"]

	def determine_add_modify_action(self, imported_user):
		"""
		Determine what to do with the ImportUser. Should set attribute "action"
		to "A" or "M". If set to "M" the returned user must be a opened
		ImportUser from LDAP.

		:param imported_user: ImportUser from input
		:return: ImportUser: ImportUser with action set and possibly fetched
		from LDAP
		"""
		# if action == "M" but user does not exist, change to "A"
		if imported_user.action == "M":
			try:
				user = imported_user.get_by_import_id(self.connection, imported_user.source_uid,
					imported_user.record_uid)
				user.update(imported_user)
			except noObject:
				self.logger.warn("%s %r (source_uid:%s record_uid: %s) has action=M in input, but does not exist in "
					"LDAP, creating instead.", imported_user.__class__.__name__, imported_user.name,
					imported_user.source_uid, imported_user.record_uid)
				user = imported_user
				user.action = "A"
		else:
			user = imported_user
		return user
