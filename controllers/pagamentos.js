module.exports = function(app){

	const PAGAMENTO_CRIADO = "CRIADO";
	const PAGAMENTO_CONFIRMADO = "CONFIRMADO";
	const PAGAMENTO_CANCELADO = "CANCELADO";

	app.get("/pagamentos", function(req, res){
		res.send("ok");
	});

	app.get("/pagamentos/pagamento/:id", function(req, res){

		var id = req.params.id;
		console.log('consultando pagamento');

		var cache = new app.servicos.memcachedClient();

		cache.get('pagamento-' + id, function(err, data){

		  if (err || !data) {

		    console.log('MISS - Chave não encontrada no cache');
				var connection = app.persistencia.connectionFactory();
				var pagamentoDao = new app.persistencia.PagamentoDao(connection);

				pagamentoDao.buscaPorId(id, function(erro, resultado){

					if (erro) {
						console.log('erro ao consultar no banco: ' + erro);
						res.status(500).send(erro);
						return;
					}

					console.log('pagamento encontrado:' + JSON.stringify(resultado));
					res.json(resultado);
					return;

				});

		  } else {

		    console.log('HIT - valor:' + JSON.stringify(data));
				res.json(data);
				return;

		  }

		});

	})

	app.post("/pagamentos/pagamento", function(req, res){

		var body = req.body;
		var pagamento = body['pagamento'];
		var connection = app.persistencia.connectionFactory();

		var pagamentoDao = new app.persistencia.PagamentoDao(connection);

		req.assert("pagamento.forma_de_pagamento", "Forma de pagamento é obrigatorio").notEmpty();
		req.assert("pagamento.valor", "Valor é obrigatorio").notEmpty().isFloat();
		req.assert("pagamento.moeda", "Moeda é obrigatorio").notEmpty().len(3,3);

		var errors = req.validationErrors();

		if (errors) {
			console.log("Erros de validação encontrados");
			res.status(400).send(errors);
			return;
		}

		if (pagamento.forma_de_pagamento == 'cartao') {
			var cartao = req.body['cartao'];
			console.log(cartao);

			var clienteCartoes = new app.servicos.clienteCartoes();

			clienteCartoes.autoriza(cartao,function(exception, request, response,retorno){
				if(exception){
					console.log(exception);
					res.status(400).send(exception);
					return;
				}
				console.log(retorno);

				res.location('/pagamentos/pagamento' + retorno.id);
				var response = {
					dados_do_pagamento: pagamento,
					cartao: retorno,
					links: [
						{
							href: "http://localhost:3000/pagamentos/pagamento/" + retorno.insertId,
							rel: "cancelar",
							method: "DELETE"
						},
						{
							href: "http://localhost:3000/pagamentos/pagamento/" + retorno.insertId,
							rel: "buscar",
							method: "GET"
						}
					]
				}

				res.status(201).json(response);
				return;

			});

		} else {

			pagamento.status = "CRIADO";
	    pagamento.data = new Date;

			console.log("Processando pagamento...");
			pagamentoDao.salva(pagamento, function(exception, result){

				if (exception) {
					console.log(exception);
					res.status(500).send('Erro ao salvar no banco:' + exception);
					return;
				}

				console.log("Pagamento criado " + JSON.stringify(pagamento));

				var id = result.insertId;
				res.location('/pagamentos/pagamento/' + id);
	      pagamento.id = id;

				var cache = new app.servicos.memcachedClient();
				cache.set('pagamento-' + id, pagamento, 10000, function(err){
				  console.log('nova chave: pagamento-' + id);
				})

				res.location('/pagamentos/pagamento' + id);
				var response = {
					dados_do_pagamento: pagamento,
					cartao: pagamento,
					links: [
						{
							href: "http://localhost:3000/pagamentos/pagamento/" + id,
							rel: "cancelar",
							method: "DELETE"
						},
						{
							href: "http://localhost:3000/pagamentos/pagamento/" + id,
							rel: "buscar",
							method: "GET"
						}
					]
				}

				res.status(201).json(response);
				return;

			})

		}

	});

	app.put("/pagamentos/pagamento/:id", function(req,res){

		var pagamento = {};
		var id = req.body.id;

		pagamento.id = id;
		pagamento.status = PAGAMENTO_CONFIRMADO;


		var connection = app.persistencia.connectionFactory();
		var pagamentoDao = new app.persistencia.PagamentoDao(connection);

		pagamentoDao.atualiza(pagamento, function(erro){
			if (erro) {
				res.status(500).send(erro);
				return;
			}
			console.log("Pagamento Atualizado");
			res.send(pagamento);
		})

	})

	app.delete("pagamentos/pagamento/:id", function(req, res){

		var pagamento = {};
		var id = req.body.id;

		pagamento.id = id;
		pagamento.status = PAGAMENTO_CANCELADO;

		var connection = app.persistencia.connectionFactory();
		var pagamentoDao = new app.persistencia.PagamentoDao(connection);

		pagamento.atualiza(pagamento, function(erro){
			if (erro) {
				res.status(500).send(erro);
				return;
			}

			console.log("Pagamento Canceloado com sucesso");
			res.status(204).send(pagamento);

		})

	})

}
