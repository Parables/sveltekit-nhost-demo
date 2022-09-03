// 'https://idel-graphql-api.herokuapp.com/graphql'

export interface GraphQLRequest {
	query: string;
	variables?: {};
	headers?: {};
	option?: { signal?: AbortSignal };
	endpoint?: string;
}

export interface GraphQLResponse<T> {
	data?: T;
	error?: string;
}

function failedRequest<T>(errorMsg: string): GraphQLResponse<T> {
	console.log('Error:-->', errorMsg);
	return {
		data: undefined,
		error: new Error(errorMsg).message
	};
}

export async function graphqlClient<T>({
	query,
	variables = {},
	option = {},
	endpoint = 'http://localhost:8000/graphql'
}: GraphQLRequest): Promise<GraphQLResponse<T>> {
	try {
		const controller = new AbortController();
		const opts = {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables }),
			signal: controller.signal
		};
		Object.assign(opts, option);

		let response = await fetch(endpoint, opts);
		let { signal } = option;
		if (signal)
			signal.addEventListener('abort', () => {
				controller.abort();
				return failedRequest('Request was aborted');
			});
		const timeout = setTimeout(() => {
			controller.abort();
			return failedRequest('Request Timeout');
		}, 3000);
		if (response) clearTimeout(timeout);
		let result = await response.json();
		if (result.errors) {
			console.log('Error:-->', result.errors);
			return {
				data: undefined,
				error: result.errors ? result.errors[0].message : undefined
			};
		} else {
			let [value] = Object.values(result?.data);
			return {
				data: <T>value || undefined, // <T>value = value as T,
				error: result.errors ? result.errors[0].message : undefined
			};
		}
	} catch (error) {
		return failedRequest(`${error}`);
	}
}
