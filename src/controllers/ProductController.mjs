import ProductModel from '../models/ProductModel.mjs'
import userModel from '../models/UserModel.mjs'
import shopModel from '../models/ShopModel.mjs'
import {
    upload
} from '../middlewares/uploadImg.mjs'
import multer from 'multer';



export const createProduct = async (req, res) => {
    upload(req, res, async function (err) {
        /* console.log(req.body);
        console.log(req.files); */
        if (err instanceof multer.MulterError) {
            return res.status(500).json({ error: 'ERRROr' });
        }
        else if (err) {
            console.log(err);
            return res.status(500).json({ error: 'Error al cargar imágenes' });
        }
        try {
            //busca idvendedor
            const userId = req.userID;
            console.log(userId)
            // Verificar si el usuario existe
            const user = await userModel.findById(userId);
            if (!user) {
                return res.status(404).json({
                    message: 'El usuario no existe'
                });
            }

            //verificar si la tienda existe
            let t = await shopModel.findOne({ propietario: user._id });
            if (!t) {
                return res.status(404).json({
                    message: 'No se ha encontrado la tienda del usuario'
                });
            }
            const tienda = t._id;

            //Creacion de producto
            const {
                categoria,
                nombre,
                descripcion,
                precio,
                stock,
            } = req.body;
            let fotos = [] //para crear departamentos sin imagenes
            if (req.files) {
                fotos = req.files.map(file => file.path.replace(/\\/g, '/').replace(/^src\//, '')); // Obtén las rutas de las imágenes
            }
            const product = new ProductModel({
                tienda,
                categoria,
                nombre,
                descripcion,
                precio,
                stock,
                fotos
            });
            await product.save();
            res.status(201).json({
                message: 'Producto creado creado',
                product
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: 'Error al registrar el producto'
            });
        }
    })
};


export const getAll = async (req, res) => {
    try {
        const { categoria, orden, nombre } = req.query;

        let filters = {
            habilitado: true
        };

        // Agregar filtro por categoría si se proporciona
        if (categoria) {
            filters.categoria = categoria;
        }

        // Agregar filtro por nombre si se proporciona
        if (nombre) {
            filters.nombre = { $regex: nombre, $options: "i" };
        }

        // Buscar productos y aplicar filtros y ordenamiento
        let query = ProductModel.find(filters, req.query.fields);

        // Ordenar productos según la dirección especificada (ascendente o descendente)
        if (orden === 'asc') {
            query = query.sort({ precio: 1 });
        } else if (orden === 'desc') {
            query = query.sort({ precio: -1 });
        }

        let products = await query.exec();

        res.status(200).json({
            products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener Productos'
        });
    }
};

export const getOne = async (req, res) => {
    try {
        const { id } = req.params;
        let prod = await ProductModel.findById(id);
        if (!prod) {
            return res.status(404).json({
                error: 'Categoria no encontrada'
            });
        }

        res.status(200).json({
            producto: prod
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener el producto'
        });
    }
};

export const getAllByShop = async (req, res) => {
    try {
        const { tiendaId } = req.params;

        // Buscar la tienda por su ID
        const tienda = await shopModel.findById(tiendaId).exec();

        if (!tienda) {
            return res.status(404).json({
                error: 'No se encontró la tienda'
            });
        }

        // Filtrar productos por la tienda
        const products = await ProductModel.find({ tienda: tiendaId }, req.query.fields).exec();

        res.status(200).json({
            data: products
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener Productos'
        });
    }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    await ProductModel.findByIdAndRemove(id);
    res.status(200).json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar el producto' });
  }
};

export const paginated = async (req, res, next) => {
    try {
        let { orden, categoria } = req.query;

        let page = parseInt(req.query.page);
        let limit = parseInt(req.query.limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;

        let filters = {
            habilitado: true
        };

        // Agregar filtro por categoría si se proporciona
        if (categoria) {
            filters.categoria = categoria;
        }

        //si no se especifica tamano el max es 20
        if (limit) {
            limit = 20;
        }
        // If the page is not applied in query.
        if (!page) {
            // Make the Default value one.
            page = 1;
        }

        const products = {};

        if (endIndex < (await ProductModel.countDocuments().exec())) {
            products.next = {
                page: page + 1,
                limit: limit,
            };
        }
        if (startIndex > 0) {
            products.previous = {
                page: page - 1,
                limit: limit,
            };
        }

        products.results = await ProductModel.find(filters).limit(limit).skip(startIndex);
        res.paginated = products;
        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Error al obtener Productos'
        });
    }
}