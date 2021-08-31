/**
 * These columns will be generated automatically: (to migrate database tables)
 * username, password, full_name, role_id, gender, birthdate, email, phone_number, status, certi_filename, createdAt, updatedAt.
 * create a new Post: create(object)
 * find a Post by id: findByPk(id)
 * get all Posts: findAll()
 * update a Post by id: update(data, where: { id: id })
 * remove a Post: destroy(where: { id: id })
 * remove all Posts: destroy(where: {})
 * find all Posts by title: findAll({ where: { title: ... } })
 * These functions will be used in our Controller.
 */
module.exports = (sequelize, Sequelize) => {
    const Role = sequelize.define("role", {
        roleType: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true
        },
    });

    return Role;
}