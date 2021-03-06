const { response } = require("express");
const Usuario = require("../models/usuario")
const bcrypt = require("bcryptjs");
const { generarJWT } = require("../helpers/jwt");
const { googleVerify } = require("../helpers/google-verify");
const { getSidebarMenu } = require("../helpers/sidebar-menu");

const login = async(req, res = response) => {

    const { email, password } = req.body;

    try {

        //Verificar email
        const usuarioDB = await Usuario.findOne({email});
        
        if (!usuarioDB) {
            return res.status(404).json({
                ok: false,
                msg: "Datos ingresados incorrectos"
            });
        }

        //Verificar contraseña
        const validPassword = bcrypt.compareSync(password, usuarioDB.password);
        
        if(!validPassword) {

            return res.status(400).json({
                ok: false,
                msg: "Datos ingresados incorrectos"
            });
        }

        //Generar el TOKEN - JWT
        const token = await generarJWT(usuarioDB._id);


        res.json({
            ok: true,
            token,
            menu: getSidebarMenu(usuarioDB.role)
        });
        
    } catch (error) {

        console.log(error);
        res.status(500).json({
            ok: false,
            msg: "Error inesperado"
        });
        
    }
}

const googleSignIn = async (req, res = response) => {

    const googleToken = req.body.token;

    try {

        const { name, email, picture } = await googleVerify(googleToken);

        const usuarioDB = await Usuario.findOne({email});
        let usuario;

        if ( !usuarioDB ) {
            usuario = new Usuario({
                nombre: name,
                email,
                password: "@@@",
                img: picture,
                google: true
            });
        } else {
            usuario = usuarioDB;
            usuario.google = true;
        }

        await usuario.save();

        //Generar el TOKEN - JWT
        const token = await generarJWT(usuario._id);
        
        res.json({
            ok: true,
            token,
            menu: getSidebarMenu(usuario.role)
        });

    } catch (error) {

        res.status(401).json({
            ok: false,
            msg: "Token invalido"
        });
        
    }


}

const renewToken = async(req, res = response) => {
    
    const uid = req.uid;

    //Generar el TOKEN - JWT
    const token = await generarJWT(uid);

    const usuario = await Usuario.findById(uid);

    res.json({
        ok: true,
        token,
        usuario,
        menu: getSidebarMenu(usuario.role)
    });
}

module.exports = {
    login,
    googleSignIn,
    renewToken
}